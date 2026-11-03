package nebula.store;

import net.luckperms.api.LuckPermsProvider;
import net.luckperms.api.model.user.User;
import net.luckperms.api.node.NodeType;
import net.luckperms.api.node.types.InheritanceNode;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Remembers forge_* groups before a paid-rank command, then puts them back
 * if LuckPerms parent-set removed them. Ascension and paid ranks are separate.
 */
public final class ForgeKeeper {
    private static final Map<UUID, Set<String>> SAVED = new HashMap<>();

    private ForgeKeeper() {
    }

    public static void remember(Collection<String> players) throws Exception {
        SAVED.clear();
        var api = LuckPermsProvider.get();
        for (String player : players) {
            UUID uuid = api.getUserManager().lookupUniqueId(player).get(5, TimeUnit.SECONDS);
            if (uuid == null) continue;
            User user = api.getUserManager().loadUser(uuid).get(5, TimeUnit.SECONDS);
            Set<String> groups = new HashSet<>();
            for (InheritanceNode node : user.getNodes(NodeType.INHERITANCE)) {
                if (node.getGroupName().startsWith("forge_")) groups.add(node.getGroupName());
            }
            if (!groups.isEmpty()) SAVED.put(uuid, groups);
        }
    }

    public static void restore() throws Exception {
        if (SAVED.isEmpty()) return;
        var api = LuckPermsProvider.get();
        try {
            for (Map.Entry<UUID, Set<String>> entry : SAVED.entrySet()) {
                User user = api.getUserManager().loadUser(entry.getKey()).get(5, TimeUnit.SECONDS);
                Set<String> current = new HashSet<>();
                for (InheritanceNode node : user.getNodes(NodeType.INHERITANCE)) {
                    current.add(node.getGroupName());
                }
                boolean changed = false;
                for (String group : entry.getValue()) {
                    if (!current.contains(group)) {
                        user.data().add(InheritanceNode.builder(group).build());
                        changed = true;
                    }
                }
                if (changed) api.getUserManager().saveUser(user).get(5, TimeUnit.SECONDS);
            }
        } finally {
            SAVED.clear();
        }
    }
}
