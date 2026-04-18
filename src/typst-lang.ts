import { StreamLanguage, StringStream } from '@codemirror/language';

interface TypstState {
  inBlockComment: boolean;
  inMath: boolean;
  inRaw: boolean;
  inString: boolean;
}

const typstLanguage = StreamLanguage.define<TypstState>({
  startState(): TypstState {
    return { inBlockComment: false, inMath: false, inRaw: false, inString: false };
  },

  token(stream: StringStream, state: TypstState): string | null {
    // Block comment continuation
    if (state.inBlockComment) {
      if (stream.skipTo('*/')) {
        stream.next(); stream.next();
        state.inBlockComment = false;
      } else {
        stream.skipToEnd();
      }
      return 'comment';
    }

    // Raw block continuation
    if (state.inRaw) {
      if (stream.skipTo('`')) {
        stream.next();
        state.inRaw = false;
      } else {
        stream.skipToEnd();
      }
      return 'string';
    }

    // Math mode continuation
    if (state.inMath) {
      if (stream.eat('$')) {
        state.inMath = false;
        return 'atom';
      }
      stream.next();
      return 'atom';
    }

    // String continuation
    if (state.inString) {
      while (!stream.eol()) {
        const ch = stream.next();
        if (ch === '\\') { stream.next(); continue; }
        if (ch === '"') { state.inString = false; break; }
      }
      return 'string';
    }

    // Line comment
    if (stream.match('//')) {
      stream.skipToEnd();
      return 'comment';
    }

    // Block comment start
    if (stream.match('/*')) {
      state.inBlockComment = true;
      return 'comment';
    }

    // Raw code
    if (stream.eat('`')) {
      if (stream.skipTo('`')) {
        stream.next();
      } else {
        state.inRaw = true;
      }
      return 'string';
    }

    // String
    if (stream.eat('"')) {
      state.inString = true;
      while (!stream.eol()) {
        const ch = stream.next();
        if (ch === '\\') { stream.next(); continue; }
        if (ch === '"') { state.inString = false; break; }
      }
      return 'string';
    }

    // Math mode
    if (stream.eat('$')) {
      if (stream.peek() === ' ' || stream.eol()) {
        state.inMath = true;
      } else {
        // Inline math
        while (!stream.eol()) {
          if (stream.eat('$')) break;
          stream.next();
        }
      }
      return 'atom';
    }

    // Hash-prefixed keywords/functions
    if (stream.eat('#')) {
      if (stream.match(/^(let|set|show|import|include|if|else|for|while|return|break|continue|context)\b/)) {
        return 'keyword';
      }
      if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_-]*/)) {
        return 'variableName';
      }
      return 'operator';
    }

    // Headings
    if (stream.sol() && stream.eat('=')) {
      while (stream.eat('=')) { /* consume all = */ }
      stream.skipToEnd();
      return 'heading';
    }

    // Bold
    if (stream.eat('*')) {
      if (stream.skipTo('*')) {
        stream.next();
      }
      return 'strong';
    }

    // Italic
    if (stream.eat('_')) {
      if (stream.skipTo('_')) {
        stream.next();
      }
      return 'emphasis';
    }

    // Labels <label>
    if (stream.eat('<')) {
      if (stream.skipTo('>')) {
        stream.next();
        return 'labelName';
      }
    }

    // References @ref
    if (stream.eat('@')) {
      stream.match(/^[a-zA-Z0-9_-]+/);
      return 'link';
    }

    // List markers
    if (stream.sol() && (stream.peek() === '-' || stream.peek() === '+')) {
      const ch = stream.next();
      if (ch && stream.peek() === ' ') {
        return 'punctuation';
      }
    }

    // Numbers
    if (stream.match(/^[0-9]+(\.[0-9]+)?(em|pt|cm|mm|in|%)?/)) {
      return 'number';
    }

    // Skip other characters
    stream.next();
    return null;
  },
});

export { typstLanguage };
