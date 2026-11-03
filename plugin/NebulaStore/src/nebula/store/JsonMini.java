package nebula.store;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Small JSON reader for the store queue payload. */
final class JsonMini {
    private final String text;
    private int index;

    private JsonMini(String text) {
        this.text = text;
    }

    static Object parse(String text) {
        JsonMini parser = new JsonMini(text);
        Object value = parser.readValue();
        parser.skip();
        if (parser.index != text.length()) {
            throw new IllegalArgumentException("Trailing JSON");
        }
        return value;
    }

    private Object readValue() {
        skip();
        if (index >= text.length()) {
            throw new IllegalArgumentException("Unexpected end of JSON");
        }
        char current = text.charAt(index);
        if (current == '{') return readObject();
        if (current == '[') return readArray();
        if (current == '"') return readString();
        if (current == 't') return readLiteral("true", Boolean.TRUE);
        if (current == 'f') return readLiteral("false", Boolean.FALSE);
        if (current == 'n') return readLiteral("null", null);
        return readNumber();
    }

    private Map<String, Object> readObject() {
        index++;
        Map<String, Object> object = new LinkedHashMap<>();
        skip();
        if (peek('}')) {
            index++;
            return object;
        }
        while (index < text.length()) {
            skip();
            String key = readString();
            skip();
            expect(':');
            object.put(key, readValue());
            skip();
            if (peek('}')) {
                index++;
                return object;
            }
            expect(',');
        }
        throw new IllegalArgumentException("Unclosed object");
    }

    private List<Object> readArray() {
        index++;
        List<Object> list = new ArrayList<>();
        skip();
        if (peek(']')) {
            index++;
            return list;
        }
        while (index < text.length()) {
            list.add(readValue());
            skip();
            if (peek(']')) {
                index++;
                return list;
            }
            expect(',');
        }
        throw new IllegalArgumentException("Unclosed array");
    }

    private String readString() {
        expect('"');
        StringBuilder builder = new StringBuilder();
        while (index < text.length()) {
            char current = text.charAt(index++);
            if (current == '"') return builder.toString();
            if (current == '\\') {
                if (index >= text.length()) break;
                char escaped = text.charAt(index++);
                switch (escaped) {
                    case '"', '\\', '/' -> builder.append(escaped);
                    case 'b' -> builder.append('\b');
                    case 'f' -> builder.append('\f');
                    case 'n' -> builder.append('\n');
                    case 'r' -> builder.append('\r');
                    case 't' -> builder.append('\t');
                    case 'u' -> {
                        if (index + 4 > text.length()) throw new IllegalArgumentException("Bad unicode escape");
                        builder.append((char) Integer.parseInt(text.substring(index, index + 4), 16));
                        index += 4;
                    }
                    default -> throw new IllegalArgumentException("Bad escape");
                }
            } else {
                builder.append(current);
            }
        }
        throw new IllegalArgumentException("Unclosed string");
    }

    private Object readLiteral(String literal, Object value) {
        if (!text.startsWith(literal, index)) throw new IllegalArgumentException("Expected " + literal);
        index += literal.length();
        return value;
    }

    private Double readNumber() {
        int start = index;
        while (index < text.length()) {
            char current = text.charAt(index);
            if ((current >= '0' && current <= '9') || current == '-' || current == '+' || current == '.' || current == 'e' || current == 'E') {
                index++;
            } else {
                break;
            }
        }
        return Double.valueOf(text.substring(start, index));
    }

    private void skip() {
        while (index < text.length() && Character.isWhitespace(text.charAt(index))) index++;
    }

    private boolean peek(char expected) {
        return index < text.length() && text.charAt(index) == expected;
    }

    private void expect(char expected) {
        if (!peek(expected)) throw new IllegalArgumentException("Expected " + expected);
        index++;
    }
}
