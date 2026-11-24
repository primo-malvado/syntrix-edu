import { studyGuides, type LessonId, type StudyGuide } from './course-study';

export type LabKind = 'automata' | 'lexer' | 'grammar' | 'parser' | 'testing';
export interface Lesson extends StudyGuide {
  id: LessonId;
  number: string;
  title: string;
  subtitle: string;
  lab: LabKind;
  syntrix: { description: string; api: string[] };
  challenges: string[];
}

export const lessons: Lesson[] = [
  {
    id: 'foundations', number: '01', title: 'Languages & foundations',
    subtitle: 'Build the mathematical vocabulary for describing and recognizing languages.', lab: 'automata',
    ...studyGuides.foundations,
    syntrix: { description: 'Syntrix converts your expression into machines. Syntrix Edu simulates them to compare recognition with alphabet membership.', api: ['regexToNfa', 'determinize'] },
    challenges: ['Change the regular expression and predict whether the empty input is accepted before running it.', 'Try a character outside the generated alphabet. Why must the machine reject it?', 'Give a string over the alphabet that the expression nevertheless rejects.']
  },
  {
    id: 'automata', number: '02', title: 'Regular expressions & automata',
    subtitle: 'Construct an ε-NFA, determinize it and read the resulting transition tables.', lab: 'automata',
    ...studyGuides.automata,
    syntrix: { description: 'Syntrix constructs the ε-NFA and DFA transition tables. Syntrix Edu adds the subset-construction explanation and diagrams; state numbering can differ.', api: ['regexToNfa', 'determinize', 'regexToDfa'] },
    challenges: ['Edit the expression to include alternation and repetition. Follow each subset-construction row.', 'Test the empty string and a non-empty string. Compare the NFA and DFA decisions.', 'Add a range such as [a-c] and inspect the derived alphabet.']
  },
  {
    id: 'lexing', number: '03', title: 'Lexical analysis',
    subtitle: 'Define token rules, inspect the generated transition table and tokenize real input.', lab: 'lexer',
    ...studyGuides.lexing,
    syntrix: { description: 'Syntrix generates a lexer from your EBNF token rules. The lab uses the resulting lexer to display tokens and transition tables.', api: ['createEbnfLexer', 'Lexer'] },
    challenges: ['Change the number rule or add an identifier token, then update the token list and input.', 'Introduce an invalid character and inspect the diagnostic.', 'Swap competing token rules and observe how priority affects equal-length matches.']
  },
  {
    id: 'grammars', number: '04', title: 'Context-free grammars',
    subtitle: 'Explore terminals, nonterminals, BNF, EBNF, derivations and ambiguity.', lab: 'grammar',
    ...studyGuides.grammars,
    syntrix: { description: 'Syntrix lowers your EBNF grammar into productions, including generated helper rules. The lab displays those productions so you can examine the transformation.', api: ['compileEbnfGrammar'] },
    challenges: ['Edit the grammar to add an alternative. Inspect the resulting productions.', 'Introduce an optional or repeated part and find the generated helper rules.', 'Rewrite the optional part as explicit alternatives and compare the lowered productions.']
  },
  {
    id: 'predictive', number: '05', title: 'FIRST, FOLLOW & LL(1)',
    subtitle: 'Compute fixed points, construct a predictive table and trace a token sequence.', lab: 'grammar',
    ...studyGuides.predictive,
    syntrix: { description: 'Syntrix lowers the grammar first. Syntrix Edu then computes FIRST and FOLLOW sets, the LL(1) table and the predictive trace; these analyses are course tools rather than Syntrix APIs.', api: ['compileEbnfGrammar'] },
    challenges: ['Change the token sequence and follow the stack one step at a time.', 'Make a production nullable and observe its FOLLOW-based table entries.', 'Introduce an LL(1) conflict and explain why one token of lookahead is insufficient.']
  },
  {
    id: 'lr-parsing', number: '06', title: 'Bottom-up & LR parsing',
    subtitle: 'Generate real ACTION/GOTO tables and trace shifts and reductions.', lab: 'parser',
    ...studyGuides['lr-parsing'],
    syntrix: { description: 'Syntrix generates parser tables for the selected algorithm and parses the input. Syntrix Edu renders the state graph and traces deterministic table actions.', api: ['createEbnfParser', 'Parser'] },
    challenges: ['Switch between SLR, LALR and LR(1), then compare the state counts.', 'Edit the expression grammar to make it ambiguous and observe conflict reporting.', 'Enter malformed input and identify the first table entry that fails.']
  },
  {
    id: 'semantics', number: '07', title: 'ASTs & semantic actions',
    subtitle: 'Turn a parse into structured data and distinguish syntax from meaning.', lab: 'parser',
    ...studyGuides.semantics,
    syntrix: { description: 'Syntrix runs the grammar’s semantic actions as it parses and returns their result. Edit the actions in the lab to change the resulting AST.', api: ['createEbnfParser', 'Parser'] },
    challenges: ['Edit the semantic actions to produce a different AST shape.', 'Change operator precedence through the grammar and compare resulting trees.', 'Add a new token and production, then update the lexer and parser token lists.']
  },
  {
    id: 'diagnostics', number: '08', title: 'Errors, testing & practice',
    subtitle: 'Distinguish failure modes and validate a language implementation systematically.', lab: 'testing',
    ...studyGuides.diagnostics,
    syntrix: { description: 'Syntrix generates and runs the lexer and parser, exposing diagnostics and errors. Syntrix Edu runs the editable acceptance and rejection suite around them.', api: ['createEbnfLexer', 'createEbnfParser', 'Lexer', 'Parser'] },
    challenges: ['Add a case with an invalid character and one with a valid token in an invalid position. Compare the errors.', 'Change an expected result and check that the suite reports the mismatch.', 'Modify the grammar and add regression cases for the new behavior.']
  }
];
