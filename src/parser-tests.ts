import { Lexer, Parser, ParserSyntaxError, type LexerGrammar, type ParserConfig } from 'syntrix';

type Expectation = 'accept' | 'reject';
export interface ParserTestResult {
  input: string;
  expected: Expectation;
  outcome: 'accepted' | 'lexical error' | 'syntax error' | 'execution error';
  passed: boolean;
  message: string;
}

export function parseTestCases(source: string): { input: string; expected: Expectation }[] {
  const cases: { input: string; expected: Expectation }[] = [];
  source.split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) return;
    const match = /^(accept|reject):(.*)$/.exec(line);
    if (!match) throw new Error(`Test line ${index + 1} must start with accept: or reject:.`);
    cases.push({ expected: match[1] === 'accept' ? 'accept' : 'reject', input: match[2] });
  });
  if (!cases.length) throw new Error('Add at least one test case.');
  if (cases.length > 100) throw new Error('The lab supports at most 100 test cases.');
  return cases;
}

export function runParserTests(lexerTable: LexerGrammar, parserTable: ParserConfig, source: string): ParserTestResult[] {
  return parseTestCases(source).map(({ input, expected }) => {
    const lexer = new Lexer(lexerTable);
    lexer.setInput(input);
    try {
      let token = lexer.nextToken();
      while (token && token.tokenType !== 'eof') token = lexer.nextToken();
      if (!token) throw new Error('The lexer needs more input.');
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      return { input, expected, outcome: 'lexical error', passed: expected === 'reject', message: error.message };
    }

    try {
      new Parser(new Lexer(lexerTable), parserTable).parse(input);
      return { input, expected, outcome: 'accepted', passed: expected === 'accept', message: '' };
    } catch (error) {
      if (error instanceof ParserSyntaxError) {
        return { input, expected, outcome: 'syntax error', passed: expected === 'reject', message: error.message };
      }
      return { input, expected, outcome: 'execution error', passed: false,
        message: error instanceof Error ? error.message : String(error) };
    }
  });
}
