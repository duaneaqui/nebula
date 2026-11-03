package nebula.store;

import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitTask;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Pattern;

public final class NebulaStorePlugin extends JavaPlugin implements Listener {
    private static final Pattern[] ALLOWED = new Pattern[] {
            Pattern.compile("^lp user [A-Za-z0-9_.]{1,16} parent remove (voyager|nova|pulsar|quasar|singularity)$"),
            Pattern.compile("^lp user [A-Za-z0-9_.]{1,16} parent set (voyager|nova|pulsar|quasar|singularity)$"),
            Pattern.compile("^stardust give [A-Za-z0-9_.]{1,16} [1-9][0-9]{0,6}$"),
            Pattern.compile("^cratekey give [A-Za-z0-9_.]{1,16} key_(comet|meteor|eclipse|horizon|empyrean) [1-9][0-9]{0,2}$")
    };

    // Next.js local/dev closes default HttpClient (HTTP/2 negotiate) with EOF —
    // "HTTP/1.1 header parser received no bytes". Force HTTP/1.1.
    private final HttpClient http = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(5))
            .build();
    private final AtomicBoolean polling = new AtomicBoolean(false);

    private String storeUrl = "";
    private String secret = "";
    private int pollSeconds = 15;
    private boolean configured;
    private BukkitTask task;

    @Override
    public void onEnable() {
        saveDefaultConfig();
        reloadLocal();
        Bukkit.getPluginManager().registerEvents(this, this);
        startPolling();
    }

    @Override
    public void onDisable() {
        if (task != null) task.cancel();
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!sender.hasPermission("nebulastore.admin")) {
            sender.sendMessage("No permission.");
            return true;
        }
        if (args.length == 1 && args[0].equalsIgnoreCase("reload")) {
            reloadConfig();
            reloadLocal();
            startPolling();
            sender.sendMessage("NebulaStore reloaded.");
            return true;
        }
        if (args.length == 1 && args[0].equalsIgnoreCase("poll")) {
            if (!configured) {
                sender.sendMessage("NebulaStore is not configured.");
                return true;
            }
            Bukkit.getScheduler().runTaskAsynchronously(this, this::poll);
            sender.sendMessage("NebulaStore poll started.");
            return true;
        }
        sender.sendMessage("Usage: /nebulastore <poll|reload>");
        return true;
    }

    @EventHandler
    public void onJoin(PlayerJoinEvent event) {
        if (!configured) return;
        Bukkit.getScheduler().runTaskLaterAsynchronously(this, this::poll, 20L);
    }

    private void reloadLocal() {
        storeUrl = getConfig().getString("store-url", "").trim().replaceAll("/+$", "");
        secret = getConfig().getString("secret", "").trim();
        pollSeconds = Math.max(5, getConfig().getInt("poll-seconds", 15));
        configured = !storeUrl.isBlank() && secret.length() >= 24 && !secret.equals("change-me");
        if (!configured) {
            getLogger().severe("Set store-url and a secret of at least 24 characters in plugins/NebulaStore/config.yml");
        }
    }

    private void startPolling() {
        if (task != null) task.cancel();
        if (!configured) return;
        task = Bukkit.getScheduler().runTaskTimerAsynchronously(this, this::poll, 40L, pollSeconds * 20L);
        getLogger().info("Polling " + storeUrl + " every " + pollSeconds + "s.");
    }

    private void poll() {
        if (!configured || !polling.compareAndSet(false, true)) return;
        try {
            List<Job> jobs = fetch();
            if (jobs.isEmpty()) return;
            rememberAscension(jobs);
            List<Result> results = Bukkit.getScheduler().callSyncMethod(this, () -> runAll(jobs)).get();
            restoreAscension();
            post(results);
        } catch (Exception ex) {
            getLogger().warning("Store poll failed: " + ex.getMessage());
        } finally {
            polling.set(false);
        }
    }

    private List<Job> fetch() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(storeUrl + "/api/plugin/queue"))
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Bearer " + secret)
                .header("Accept", "application/json")
                .header("User-Agent", "NebulaStore/1.0")
                .GET()
                .build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new IllegalStateException("Queue HTTP " + response.statusCode());
        }
        Object parsed = JsonMini.parse(response.body());
        if (!(parsed instanceof Map<?, ?> root)) return List.of();
        Object raw = root.get("commands");
        if (!(raw instanceof List<?> commands)) return List.of();
        List<Job> jobs = new ArrayList<>();
        for (Object entry : commands) {
            if (!(entry instanceof Map<?, ?> map)) continue;
            String id = string(map.get("id"));
            String command = string(map.get("command"));
            String player = string(map.get("player"));
            boolean requireOnline = Boolean.TRUE.equals(map.get("requireOnline"));
            if (id.isBlank() || command.isBlank() || player.isBlank()) continue;
            jobs.add(new Job(id, command, player, requireOnline));
        }
        return jobs;
    }

    private List<Result> runAll(List<Job> jobs) {
        List<Result> results = new ArrayList<>();
        for (Job job : jobs) {
            if (!allowed(job.command) || !subject(job.command).equals(job.player)) {
                getLogger().severe("Blocked store command " + job.id);
                results.add(new Result(job.id, "failed", "Blocked by allowlist."));
                continue;
            }
            if (job.requireOnline && Bukkit.getPlayerExact(job.player) == null) {
                results.add(new Result(job.id, "deferred", "Player is offline."));
                continue;
            }
            boolean ok = Bukkit.dispatchCommand(Bukkit.getConsoleSender(), job.command);
            if (!ok && job.command.contains(" parent remove ")) {
                ok = true;
            }
            if (ok) {
                getLogger().info("Ran: " + job.command);
                results.add(new Result(job.id, "executed", ""));
            } else {
                getLogger().warning("Command returned false: " + job.command);
                results.add(new Result(job.id, "failed", "Command returned false."));
            }
        }
        return results;
    }

    private void post(List<Result> results) throws Exception {
        if (results.isEmpty()) return;
        StringBuilder body = new StringBuilder("{\"results\":[");
        for (int i = 0; i < results.size(); i++) {
            Result result = results.get(i);
            if (i > 0) body.append(',');
            body.append("{\"id\":\"")
                    .append(escape(result.id))
                    .append("\",\"status\":\"")
                    .append(escape(result.status))
                    .append("\",\"detail\":\"")
                    .append(escape(result.detail))
                    .append("\"}");
        }
        body.append("]}");
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(storeUrl + "/api/plugin/queue"))
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Bearer " + secret)
                .header("Content-Type", "application/json")
                .header("User-Agent", "NebulaStore/1.0")
                .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                .build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new IllegalStateException("Ack HTTP " + response.statusCode());
        }
    }

    private void rememberAscension(List<Job> jobs) {
        if (Bukkit.getPluginManager().getPlugin("LuckPerms") == null) return;
        Set<String> players = new LinkedHashSet<>();
        for (Job job : jobs) {
            if (job.command.contains(" parent set ")) players.add(job.player);
        }
        if (players.isEmpty()) return;
        try {
            Class.forName("nebula.store.ForgeKeeper")
                    .getMethod("remember", Collection.class)
                    .invoke(null, players);
        } catch (Throwable ex) {
            getLogger().warning("Could not snapshot Ascension groups: " + ex.getMessage());
        }
    }

    private void restoreAscension() {
        if (Bukkit.getPluginManager().getPlugin("LuckPerms") == null) return;
        try {
            Class.forName("nebula.store.ForgeKeeper").getMethod("restore").invoke(null);
        } catch (Throwable ex) {
            getLogger().warning("Could not restore Ascension groups: " + ex.getMessage());
        }
    }

    private static boolean allowed(String command) {
        for (Pattern pattern : ALLOWED) {
            if (pattern.matcher(command).matches()) return true;
        }
        return false;
    }

    private static String subject(String command) {
        String[] parts = command.split(" ");
        return parts.length > 2 ? parts[2] : "";
    }

    private static String string(Object value) {
        return value instanceof String text ? text : "";
    }

    private static String escape(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
    }

    private record Job(String id, String command, String player, boolean requireOnline) {
    }

    private record Result(String id, String status, String detail) {
    }
}
