export type LessonId = 'foundations' | 'automata' | 'lexing' | 'grammars' | 'predictive' | 'lr-parsing' | 'semantics' | 'diagnostics';

export type ExamplePreset =
  | { kind: 'automata'; regex: string; input: string }
  | { kind: 'lexer'; lexer: string; tokens: string; input: string }
  | { kind: 'grammar'; grammar: string; start: string; tokens: string; input: string }
  | { kind: 'parser'; input: string; grammar?: string; tokens?: string }
  | { kind: 'testing'; cases: string };

export interface StudyGuide {
  outcomes: string[];
  sections: { title: string; paragraphs: string[] }[];
  example: { title: string; introduction: string; steps: string[]; conclusion: string; preset: ExamplePreset };
  references: { author: string; title: string; url: string; focus: string }[];
}

const mit = {
  author: 'Michael Sipser, MIT OpenCourseWare (2020)',
  title: 'Theory of Computation: lecture notes',
  url: 'https://ocw.mit.edu/courses/18-404j-theory-of-computation-fall-2020/resources/lecture-notes/',
  focus: 'Lectures 1–4 cover automata, regular expressions, the pumping lemma and context-free grammars.'
};
const cornell = {
  author: 'Andrew Myers, Cornell University (2023)',
  title: 'CS 4120: Introduction to Compilers, lecture notes',
  url: 'https://courses.cs.cornell.edu/cs4120/2023sp/notes/index.html',
  focus: 'Consult the sections on lexing, top-down and bottom-up parsing, and semantic analysis.'
};
const scanning = {
  author: 'Robert Nystrom (2021)',
  title: 'Crafting Interpreters, chapter 4: Scanning',
  url: 'https://craftinginterpreters.com/scanning.html',
  focus: 'A practical scanner, token representation and longest-match behavior.'
};
const grammarReference = {
  author: 'Robert Nystrom (2021)',
  title: 'Crafting Interpreters, chapter 5: Representing Code',
  url: 'https://craftinginterpreters.com/representing-code.html',
  focus: 'Grammars, syntax trees and representations of expressions.'
};
const parsing = {
  author: 'Robert Nystrom (2021)',
  title: 'Crafting Interpreters, chapter 6: Parsing Expressions',
  url: 'https://craftinginterpreters.com/parsing-expressions.html',
  focus: 'Precedence, recursive descent and syntax-error recovery.'
};
const resolving = {
  author: 'Robert Nystrom (2021)',
  title: 'Crafting Interpreters, chapter 11: Resolving and Binding',
  url: 'https://craftinginterpreters.com/resolving-and-binding.html',
  focus: 'Scopes, name resolution and a separate semantic-analysis pass.'
};

export const studyGuides: Record<LessonId, StudyGuide> = {
  foundations: {
    outcomes: ['Distinguish symbols, strings, alphabets and languages.', 'Use ε, ∅, Σ* and basic language operations correctly.', 'Explain recognition and use the pumping lemma to reason about non-regularity.'],
    sections: [
      { title: 'What is a language?', paragraphs: [
        'A computer receives a sequence of symbols, but not every sequence is a valid program. A language specifies the sequences we want to describe. A recognizer takes one sequence and answers whether it belongs to that language; it need not explain its meaning.',
        'An alphabet Σ is a finite set of symbols, for example {a, b}. A string is a finite sequence over Σ: abba has length 4. The empty string ε has length 0. Σ* contains every finite string over Σ, including ε; Σ+ contains the non-empty strings.'
      ] },
      { title: 'Sets and operations', paragraphs: [
        'A language L is any subset of Σ*. The empty language ∅ contains no strings, whereas {ε} contains exactly one string. In particular, ε ∈ {ε}, but ε ∉ ∅. This distinction matters when constructing grammars and automata.',
        'Union L ∪ M contains strings from either language. Concatenation LM contains xy for x ∈ L and y ∈ M. L* contains zero or more concatenated strings from L, so ε ∈ L* even when L is empty. L+ contains one or more concatenated strings from L; it can contain ε if L itself contains ε.'
      ] },
      { title: 'Recognition and expressive power', paragraphs: [
        'A finite automaton has finitely many states and recognizes a regular language. A context-free grammar can describe structures such as arbitrarily nested parentheses; a pushdown automaton has a stack that can remember the nesting depth.',
        'Regular languages are closed under union, concatenation, star, intersection and complement. Complement is always relative to a chosen Σ*. These closure facts help prove that new languages are regular, but they do not mean every language is regular.'
      ] },
      { title: 'The pumping lemma and its quantifiers', paragraphs: [
        'If L is regular, there is a pumping length p such that every w ∈ L with |w| ≥ p has a decomposition w = xyz with |xy| ≤ p, |y| > 0 and xyⁱz ∈ L for every i ≥ 0. The regular-language assumption guarantees that some suitable decomposition exists for each long enough string.',
        'To disprove regularity, assume an arbitrary pumping length p and choose a suitable w. Then show that every permitted decomposition fails for at least one i. For {aⁿbⁿ | n ≥ 0}, choose aᵖbᵖ. Since |xy| ≤ p, y consists only of a symbols; pumping i = 0 leaves fewer a symbols than b symbols, a contradiction. A single bad decomposition is not enough.'
      ] },
      { title: 'Where lexers and parsers fit', paragraphs: [
        'A lexer groups characters into tokens such as NUMBER and PLUS. A parser checks the order and nesting of those tokens using a grammar. Later semantic analysis checks facts such as whether a name is declared. These are different questions, even if a practical implementation combines some stages.',
        'Start with the recognition lab below, then proceed to module 2 to inspect the machines. The lab derives an alphabet from the expression; a theoretical alphabet may instead be chosen independently and include symbols that never occur in the language.'
      ] }
    ],
    example: {
      title: 'Alphabet membership versus language membership',
      introduction: 'Let Σ = {a, b} and describe L with a*b: zero or more a symbols followed by one b.',
      steps: ['The strings b, ab and aaab belong to L. The empty string does not, because the final b is required.', 'The string ba belongs to Σ*: both characters are in the alphabet. It is not in L because a occurs after b.', 'The string ac is not in Σ*, because c is outside the chosen alphabet.', 'Load the example and compare aaab, ba, ac and the empty string. Run the lab again after each edit.'],
      conclusion: 'Membership in Σ* is necessary for membership in L, but it is not sufficient.',
      preset: { kind: 'automata', regex: 'a*b', input: 'aaab' }
    },
    references: [mit, { ...grammarReference, focus: 'Read the introduction to grammars and formal descriptions of syntax.' }]
  },
  automata: {
    outcomes: ['Read a regular expression and distinguish DFA and ε-NFA transitions.', 'Construct an NFA from regex fragments and determinize it with ε-closures.', 'Explain missing transitions, equivalence and the purpose of DFA minimization.'],
    sections: [
      { title: 'Regular expressions describe sets', paragraphs: [
        'A regular expression describes a language. For expressions R and S, R|S is a choice, RS is concatenation, and R* means zero or more repetitions of R. Parentheses group expressions; repetition binds more tightly than concatenation, which binds more tightly than alternation.',
        'For example, a(b|c)* accepts a, ab and acb, but not ε or ba. R+ means one or more repetitions and R? makes R optional. The lab supports Syntrix syntax and character ranges; it does not claim to implement every feature of JavaScript regular expressions.'
      ] },
      { title: 'DFA: exactly one next state', paragraphs: [
        'A deterministic finite automaton is commonly written M = (Q, Σ, δ, q₀, F): Q is the finite set of states, Σ the alphabet, q₀ the initial state, F the accepting states, and δ: Q × Σ → Q the transition function.',
        'Begin at q₀ and apply δ once per input symbol. Accept only if the entire input has been consumed and the final state is in F. A drawn or implemented machine may omit transitions; treat them as rejection, or add an explicit non-accepting sink to obtain a total DFA.'
      ] },
      { title: 'NFA and ε transitions', paragraphs: [
        'An NFA may have zero, one or several destinations for a state and symbol. An ε-NFA may also move without consuming input. Its transition function returns a set of states, rather than a single state.',
        'A string is accepted if at least one possible path consumes all of it and ends in an accepting state. An ε-closure is the set of a state and every state reachable from it through zero or more ε transitions. Cycles must not cause the closure algorithm to repeat forever.'
      ] },
      { title: 'Building an NFA from a regex', paragraphs: [
        'A standard fragment construction starts with a labeled edge for a literal. For concatenation, connect the first fragment to the second with ε. For alternation, introduce a new entry and exit, with ε paths through either alternative.',
        'For R*, add ε paths that bypass R, enter R, repeat it and leave it. This construction proves regular expressions can be recognized by finite automata. Different implementations can simplify fragments or renumber states without changing the language.'
      ] },
      { title: 'Subset construction', paragraphs: [
        'A DFA state represents a set of NFA states. Start with the ε-closure of the NFA start state. For each DFA state T and symbol a, first collect all a destinations of states in T, then take their ε-closure. Add a row for each new set until no new set appears.',
        'A subset is accepting if it contains an accepting NFA state. The empty subset is the sink in a complete DFA; this lab omits it and shows ∅ for a missing transition. Up to 2^|Q| subsets are possible, where |Q| is the number of NFA states, although many may be unreachable.'
      ] },
      { title: 'Equivalence and minimization', paragraphs: [
        'Two machines are equivalent when they accept exactly the same language, not when they have the same state numbers or diagram. Determinization preserves the language; it does not necessarily produce a minimal DFA.',
        'To minimize a DFA, remove unreachable states, divide the rest into accepting and non-accepting groups, and repeatedly split groups when a symbol leads to different groups. Merge states left in the same group after the partition stabilizes. Complete missing transitions consistently before applying this procedure.'
      ] }
    ],
    example: {
      title: 'From ε-NFA to DFA, one table row at a time',
      introduction: 'Consider a hand-built ε-NFA for a+ over Σ = {a}: start 0; accepting state 3; transitions 0 —ε→ 1, 1 —a→ 2, 2 —ε→ 1 and 2 —ε→ 3.',
      steps: ['D0 = ε-closure({0}) = {0, 1}; it is not accepting.', 'On a, the direct destinations from D0 are {2}. Their ε-closure is {1, 2, 3}, so create accepting state D1.', 'On a, D1 again moves directly to {2}, whose closure is {1, 2, 3}; the table entry is therefore D1.', 'The resulting table has D0 —a→ D1 and D1 —a→ D1. It rejects ε and accepts a, aa, and so on.', 'Load a+ in the lab. Its NFA may use different state numbers or a different construction; compare the accepted language and the displayed closures, not the numbering.'],
      conclusion: 'Each DFA row is an NFA-state set; acceptance follows from whether that set contains state 3.',
      preset: { kind: 'automata', regex: 'a+', input: 'aa' }
    },
    references: [mit, { ...cornell, focus: 'The lexing notes connect regular expressions and automata to scanners.' }]
  },
  lexing: {
    outcomes: ['Distinguish a token type, a lexeme and a token value.', 'Apply longest match and rule priority to competing token rules.', 'Explain lexical errors, ignored tokens and scanner state.'],
    sections: [
      { title: 'From characters to tokens', paragraphs: [
        'A lexer, or scanner, groups source characters into tokens for a parser. A token type identifies a category such as NUMBER; the lexeme is the exact matched text, such as 42. A value may additionally store the number 42, and a source span can record where it appeared.',
        'For 12 + 3, a lexer might produce NUMBER("12"), PLUS("+"), NUMBER("3") after ignoring whitespace. The parser sees token types and their values; it does not normally need to rediscover the boundaries between characters.'
      ] },
      { title: 'Rules, longest match and priority', paragraphs: [
        'Each token rule describes possible lexemes. A scanner tries to consume the longest valid token from the current input position. When two rules match the same longest lexeme, rule priority resolves the tie; it does not justify splitting a longer match.',
        'For example, keyword IF and identifier ID may both match if. If IF has higher tie priority, the lexeme if becomes IF. But ifx is a longer identifier and must not be split into IF followed by ID merely because it begins with if.'
      ] },
      { title: 'How a DFA scanner finds the token', paragraphs: [
        'Begin at the current position and follow character transitions while possible. Remember the most recent accepting state and input position. When no further transition exists, return the longest remembered match and continue from its end.',
        'If no accepting state was reached, report a lexical error at the current position. An empty-matching token rule is dangerous: it could produce tokens without advancing. Syntrix rejects such lexical rules.'
      ] },
      { title: 'Whitespace, states and streaming', paragraphs: [
        'Whitespace and comments can be emitted as tokens or ignored by the parser, depending on the language. Lexer states can select different active rules inside a string or comment. Source positions should be retained when later diagnostics need to point back to the original text.',
        'A streaming lexer may need more input before it can determine a token. The educational lab submits complete input, not a stream. Unicode, encodings and line endings require explicit choices; a “character” may mean a code unit, code point or grapheme depending on the implementation.'
      ] },
      { title: 'Syntrix lexical grammars', paragraphs: [
        'The lab writes rules in Syntrix EBNF rather than JavaScript regex syntax. For example, NUMBER = "0".."9", { "0".."9" }; matches one or more digits. The token list selects rules in priority order; changing the grammar alone does not automatically add a token to that list.',
        'The displayed DFA transition table describes character-level recognition. Its states and ranges are implementation details; the token stream is the observable result. Module 4 explains EBNF notation in more detail.'
      ] }
    ],
    example: {
      title: 'Keyword or identifier?',
      introduction: 'Define IF = "if" before an ID rule accepting lowercase letters, and tokenize the input if ifx.',
      steps: ['At the first position, IF and ID both match the two-character lexeme if. The earlier IF rule wins the tie.', 'The space is matched by SPACE; this lexer lab displays it because SPACE is in the token list.', 'At the next position, ID matches the whole lexeme ifx. IF matches only if, so ID wins by length.', 'Swap IF and ID in the token list and rerun. The first lexeme changes to ID, but ifx remains one ID token.'],
      conclusion: 'Longest match is decided before equal-length rule priority.',
      preset: { kind: 'lexer', lexer: 'IF = "if";\nID = "a".."z", { "a".."z" };\nSPACE = " ", { " " };', tokens: 'IF ID SPACE', input: 'if ifx' }
    },
    references: [scanning, { ...cornell, focus: 'Read the lexing section for scanner generation, states and regular expressions.' }]
  },
  grammars: {
    outcomes: ['Identify terminals, nonterminals, productions and a start symbol.', 'Perform derivations and distinguish ambiguity from a single parse.', 'Translate common EBNF constructs into equivalent productions.'],
    sections: [
      { title: 'A grammar describes structure', paragraphs: [
        'A context-free grammar consists of terminals, nonterminals, productions and a start nonterminal. Terminals are the symbols in the input to the parser, usually token types. Nonterminals name syntactic categories such as expression or statement.',
        'A production A → α permits replacing nonterminal A with the sequence α. A grammar is “context-free” because that replacement does not depend on surrounding symbols. A string is in the generated language if the start symbol can derive it using productions.'
      ] },
      { title: 'Derivations and parse trees', paragraphs: [
        'A derivation starts at the start symbol and repeatedly expands a nonterminal. In a leftmost derivation, always expand the leftmost remaining nonterminal; a rightmost derivation chooses the rightmost. A parse tree records which productions were used and how their parts nest.',
        'An ambiguous grammar has at least one terminal string with two distinct parse trees. Two different orders of expanding independent branches do not by themselves prove ambiguity. Ambiguity is a property of a grammar; some languages have both ambiguous and unambiguous grammars.'
      ] },
      { title: 'BNF, EBNF and lowering', paragraphs: [
        'BNF writes productions and alternatives; EBNF adds conveniences such as grouping, optional parts and repetition. Notation varies between tools. In Syntrix, a comma separates a sequence, | introduces an alternative, [ ... ] is optional and { ... } repeats zero or more times.',
        'An optional B can be expressed with Opt → B | ε. A repetition of C can be expressed with Tail → C Tail | ε. These are examples of equivalent BNF rules, not a promise about Syntrix helper names or recursion direction. The lab displays the actual generated productions.'
      ] },
      { title: 'Precedence, associativity and ambiguity', paragraphs: [
        'With E → E + E | E * E | NUMBER, the input NUMBER + NUMBER * NUMBER has competing trees. To make multiplication bind more tightly, separate levels: E → E + T | T; T → T * F | F; F → NUMBER. Left recursion at a level gives a natural left-associative structure.',
        'Associativity answers a different question from precedence: a - b - c is usually grouped as (a - b) - c, while some operators associate to the right. Parentheses can override the default grouping.'
      ] },
      { title: 'Preparing a grammar for a parser', paragraphs: [
        'Direct left recursion A → A α | β can make a naive recursive-descent parser recurse without consuming input. Under the usual assumptions, rewrite it as A → β A′ and A′ → α A′ | ε. Take care that semantic actions and associativity still express the intended meaning.',
        'Left factoring moves a shared prefix before a new nonterminal, postponing a choice. These transformations do not guarantee LL(1). FIRST, FOLLOW and table conflicts in module 5 reveal whether one-token predictive parsing can choose unambiguously.'
      ] },
      { title: 'Why a stack helps', paragraphs: [
        'A pushdown automaton has a finite control and a stack. For balanced parentheses, it can push when it reads an opening parenthesis and pop for a closing one, rejecting unmatched closers and requiring an empty stack at the end.',
        'Context-free grammars and nondeterministic pushdown automata characterize the same class of languages. Context-free languages are not generally closed under intersection or complement. A parser and grammar describe syntax; they do not automatically check all semantic constraints.'
      ] }
    ],
    example: {
      title: 'Lower an optional and a repetition',
      introduction: 'The Syntrix rule entry = A, [ B ], { C }; describes an A, an optional B, and zero or more C tokens.',
      steps: ['Introduce Opt → B | ε, so the optional part can either contribute B or disappear.', 'Introduce Tail → C Tail | ε, so the repetition can generate zero, one or many C tokens.', 'Replace the original rule with entry → A Opt Tail. Thus A, A B and A B C C are examples in the language.', 'Load the EBNF in the lab and inspect the generated helper productions. Syntrix may choose different helper names and a different recursion direction.'],
      conclusion: 'EBNF adds convenient notation; lowering makes the alternatives and empty cases explicit.',
      preset: { kind: 'grammar', grammar: 'entry = A, [ B ], { C };', start: 'entry', tokens: 'A B C', input: '' }
    },
    references: [mit, grammarReference, parsing]
  },
  predictive: {
    outcomes: ['Compute nullable, FIRST and FOLLOW sets to a fixed point.', 'Fill an LL(1) table, including nullable productions.', 'Trace a predictive parser and recognize table conflicts.'],
    sections: [
      { title: 'Why one-token prediction needs sets', paragraphs: [
        'A top-down parser expands the start symbol toward the input. A predictive parser chooses a production for the nonterminal on top of its stack using the next input token, called lookahead. LL(1) means left-to-right input, a leftmost derivation and one lookahead token.',
        'Nullable, FIRST and FOLLOW tell us which lookaheads can select each alternative. These sets are calculated from the grammar, not from a single example input.'
      ] },
      { title: 'Nullable and FIRST', paragraphs: [
        'A symbol or sequence is nullable if it can derive ε. FIRST(X) contains terminals that can begin a string derived from X, and contains ε if X is nullable. FIRST of a terminal is the terminal itself; FIRST(ε) = {ε}.',
        'For X₁X₂…Xₙ, add FIRST(X₁) without ε. If X₁ is nullable, continue with X₂, and so on. Add ε only if the whole sequence is nullable. Apply the rules repeatedly until a full pass adds nothing; this is a fixed point.'
      ] },
      { title: 'FOLLOW', paragraphs: [
        'FOLLOW(A) contains terminals that can appear immediately after A in a sentential form. Place the end marker $ in FOLLOW of the start symbol. For B → α A β, add FIRST(β) without ε to FOLLOW(A).',
        'If β is nullable, also add FOLLOW(B) to FOLLOW(A). Iterate until the sets stop changing. FOLLOW does not include ε: the end marker is a separate symbol indicating the end of the token stream.'
      ] },
      { title: 'Build and interpret the LL(1) table', paragraphs: [
        'For each production A → α, place it in M[A, t] for every terminal t in FIRST(α) except ε. If α is nullable, also place it in M[A, t] for each t in FOLLOW(A), including $ when applicable.',
        'An empty entry means no production is valid for that nonterminal and lookahead. Multiple productions in one cell are a conflict. The grammar is not LL(1) under this construction; do not silently select the first production.'
      ] },
      { title: 'Trace the stack', paragraphs: [
        'Initialize the stack with $ and the start symbol. If the top is a terminal equal to the lookahead, pop and consume it. If it is a nonterminal, consult the table, pop it and push the selected production in reverse order so its first symbol is processed next.',
        'Accept when both stack and input reach $. A missing entry, mismatched terminal or conflict stops the trace. The lab uses eof in sets and traces and displays $ in table headings; it adds that end marker automatically.'
      ] }
    ],
    example: {
      title: 'FIRST, FOLLOW and a predictive table',
      introduction: 'Use entry → prefix B and prefix → A prefix | ε. Here A and B are token types, not characters of a raw input string.',
      steps: ['prefix is nullable; FIRST(prefix) = {A, ε}. Since B is not nullable, FIRST(entry) = {A, B}.', 'FOLLOW(entry) = {$}; prefix is followed by B, so FOLLOW(prefix) = {B}.', 'In row entry, put entry → prefix B under both A and B. In row prefix, put prefix → A prefix under A and prefix → ε under B.', 'For input A A B, expand entry, twice choose prefix → A prefix, then use prefix → ε on lookahead B. Match B and accept at $.', 'Load the example and expand the numbered productions to match the table cells with the lab’s production IDs.'],
      conclusion: 'The nullable alternative is selected by FOLLOW(prefix), not by an ε column in the table.',
      preset: { kind: 'grammar', grammar: 'entry = prefix, B;\nprefix = A, prefix | "";', start: 'entry', tokens: 'A B', input: 'A A B' }
    },
    references: [{ ...cornell, focus: 'Read the top-down parsing section on FIRST, FOLLOW and predictive tables.' }, parsing]
  },
  'lr-parsing': {
    outcomes: ['Explain shifts, reductions, LR items, closure and GOTO.', 'Construct a small LR table and trace the state stack.', 'Compare SLR, canonical LR(1), LALR and GLR without conflating them.'],
    sections: [
      { title: 'Bottom-up parsing', paragraphs: [
        'Instead of expanding the start symbol, a bottom-up parser reads input and reduces recognized handles to nonterminals. A shift consumes a token and moves to a state; a reduction replaces the symbols of a production’s right-hand side with its left-hand side.',
        'LR means left-to-right input and a rightmost derivation in reverse. The stack records states and, conceptually, grammar symbols. After reducing A → β, pop the symbols and states for β, then consult GOTO on A from the newly exposed state.'
      ] },
      { title: 'Items, closure and GOTO', paragraphs: [
        'An LR(0) item is a production with a dot marking progress, such as A → α · B β. If the dot precedes B, closure includes B → · γ for every B production, and repeats until no new items are added.',
        'GOTO(I, X) advances the dot over X in all applicable items of I and then takes closure. Starting from the augmented start item and repeatedly computing GOTO yields a finite collection of item sets and transitions. Each item set becomes a parser state.'
      ] },
      { title: 'ACTION and GOTO tables', paragraphs: [
        'A terminal transition creates a shift action; a nonterminal transition creates a GOTO entry. A completed item can produce a reduce action, and a completed augmented start item produces accept on the end marker. The precise reduction lookaheads depend on the LR construction.',
        'At run time, ACTION[state, lookahead] chooses shift, reduce, accept or error. GOTO[state, nonterminal] is used after a reduction. In the lab, sN means shift to N, rN means reduce by production N, and acc means accept; numbered nonterminal cells are GOTO states.'
      ] },
      { title: 'SLR, LR(1), LALR and GLR', paragraphs: [
        'SLR uses LR(0) item states and FOLLOW sets to restrict reductions. An LR(1) item adds a lookahead: from A → α · B β with lookahead a, closure includes B → · γ with each lookahead in FIRST(βa). Canonical LR(1) distinguishes states using these lookaheads.',
        'LALR combines states with the same LR(0) core and unions their lookaheads; it can be smaller but merging can introduce conflicts. GLR can retain multiple actions and explore alternatives instead of forcing a single deterministic choice. This does not make an ambiguous grammar unambiguous.'
      ] },
      { title: 'Conflicts and practical trade-offs', paragraphs: [
        'A shift/reduce conflict offers both actions for the same state and lookahead; a reduce/reduce conflict offers multiple reductions. Investigate the grammar and intended meaning before resolving a conflict using a rewrite or a declared precedence policy.',
        'The state diagram in the lab shows shift and GOTO transitions, not reductions; reductions are table decisions. The single-stack trace is displayed for deterministic algorithms. For GLR, multiple stacks or parse alternatives cannot be represented faithfully by that trace.'
      ] }
    ],
    example: {
      title: 'A tiny LR table',
      introduction: 'Consider the augmented grammar S′ → S and S → NUMBER. This example numbers states for explanation; a generator may choose different numbers.',
      steps: ['I0 contains S′ → · S and S → · NUMBER. GOTO(I0, S) = I1; GOTO(I0, NUMBER) = I2.', 'I1 contains S′ → S ·, so ACTION[I1, $] = accept. I2 contains S → NUMBER ·, so reduce by S → NUMBER on $.', 'In I0, ACTION[I0, NUMBER] = shift I2 and GOTO[I0, S] = I1.', 'For NUMBER $, start in I0, shift NUMBER to I2, reduce to S, use GOTO(I0, S) = I1, and accept on $.', 'Load the equivalent Syntrix grammar entry = NUMBER; and input 7. Inspect its actual productions, table and trace; its synthetic start rule and state numbers may differ.'],
      conclusion: 'A reduction uses both a production and the GOTO entry of the state exposed after popping.',
      preset: { kind: 'parser', grammar: 'entry = NUMBER;', tokens: 'NUMBER', input: '7' }
    },
    references: [{ ...cornell, focus: 'Read the bottom-up parsing and LR sections for items, tables and LR variants.' }, parsing]
  },
  semantics: {
    outcomes: ['Explain the difference between parse trees and ASTs.', 'Use semantic actions to build a structured value.', 'Separate syntactic parsing from name resolution and type checking.'],
    sections: [
      { title: 'Parse tree versus AST', paragraphs: [
        'A parse tree records how grammar productions derive an input, often including punctuation and helper nonterminals. An abstract syntax tree (AST) keeps the structure needed by later work and may omit punctuation or intermediate grammar rules.',
        'For 4 * (2 + 3), a useful AST has a multiply node with children number(4) and add(number(2), number(3)). The parentheses affect grouping even though they need not become AST nodes.'
      ] },
      { title: 'Semantic values and actions', paragraphs: [
        'A parser can associate a value with each recognized token or production. An action on a production computes the value of its left-hand side from its children. In the lab’s Syntrix grammar, $1, $2 and so on refer to child values and $$ assigns the resulting value.',
        'Actions execute JavaScript inside a time-limited worker. This keeps long-running work from blocking the interface, but the worker is not a security sandbox. Run only trusted grammar actions.'
      ] },
      { title: 'Attributes and evaluation order', paragraphs: [
        'A synthesized attribute is computed from children and passed to a parent; AST construction during reduction is a common example. An inherited attribute carries information from a parent or sibling and often needs an additional traversal or explicit context.',
        'Actions with side effects can make parsing order observable and complicate error recovery or ambiguous parsing. Constructing a tree first and performing later passes can make the meaning and diagnostics easier to test.'
      ] },
      { title: 'Name resolution and type checking', paragraphs: [
        'Syntax alone cannot tell whether an identifier refers to a declaration in scope. A name-resolution pass builds or consults symbol tables as it visits declarations and uses. Nested scopes require rules for visibility and shadowing.',
        'A type checker verifies rules such as requiring compatible operands for an operator. An expression can have a valid parse but fail a semantic check. Preserve source spans on nodes when useful so later diagnostics can identify the original location.'
      ] }
    ],
    example: {
      title: 'Build an AST for an expression',
      introduction: 'Use the lab’s expression grammar and the input 4 * (2 + 3). The grammar gives multiplication higher precedence than addition.',
      steps: ['The NUMBER action converts each numeric lexeme to a number node.', 'The parenthesized expression returns the value of the inner expression instead of adding a parentheses node.', 'The PLUS reduction constructs an add node with the 2 and 3 nodes as children.', 'The STAR reduction constructs a multiply node whose children are the 4 node and the add node.', 'Change the STAR action’s type field, rerun and observe that the output tree changes while the input syntax stays the same.'],
      conclusion: 'Grammar structure determines grouping; actions decide the value built from that structure.',
      preset: { kind: 'parser', input: '4 * (2 + 3)' }
    },
    references: [grammarReference, resolving, { ...cornell, focus: 'Read the semantic-analysis and type-checking sections.' }]
  },
  diagnostics: {
    outcomes: ['Distinguish lexical, syntax and semantic failures.', 'Design positive, negative and boundary test cases with explicit expectations.', 'Explain the limits of recovery and of the interactive test runner.'],
    sections: [
      { title: 'Different stages, different failures', paragraphs: [
        'A lexical error occurs when no token rule matches the next input. A syntax error occurs when valid tokens cannot be arranged according to the grammar. A semantic error occurs after syntactic recognition, for example an undeclared name or incompatible types.',
        'For an assignment grammar, x=@; can fail lexically at @, while x=; can tokenize successfully but fail syntactically because a value is missing. Whether a name is declared is a separate semantic question that the example grammar does not check.'
      ] },
      { title: 'Useful diagnostics and recovery', paragraphs: [
        'A useful diagnostic identifies a location, the unexpected input and, when available, expected symbols. A source excerpt and caret can make the error understandable. Report the original error rather than silently pretending the input was accepted.',
        'Panic-mode recovery skips tokens until a synchronization point such as a semicolon, then attempts to continue. Recovery must make progress and can produce cascading errors. It is a design trade-off, not proof that the original input was valid.'
      ] },
      { title: 'Design a test suite', paragraphs: [
        'Write accepted and rejected examples, then cover empty input, minimal and large inputs, overlapping token rules, nested constructs, precedence and malformed boundaries. Record an explicit expected result for each case rather than deciding whether output looks plausible afterward.',
        'A regression test records a previously observed bug and the correct result. Property tests can check broader invariants, such as NFA and DFA agreement on many generated short strings. Agreement alone is not proof: both implementations may share a defect.'
      ] },
      { title: 'What the lab checks', paragraphs: [
        'The lab compiles the editable lexer and parser, then runs up to 100 one-line cases. Write accept: or reject: followed by the exact input; no text after the colon represents the empty string. Whitespace after the colon is part of the input.',
        'Each case is fully tokenized before parsing, so a lexical error anywhere in that case is reported first. A syntax error satisfies an expected rejection; an unexpected execution error does not. This checks acceptance, not semantic correctness or an expected AST. Parser actions are trusted JavaScript; the worker is not a security sandbox.'
      ] },
      { title: 'A capstone workflow', paragraphs: [
        'Define a small language and write down token rules, a grammar, precedence and intended meaning. Implement and test the scanner, then the parser, then AST construction and semantic checks. Test both successful and failing programs at each boundary.',
        'For a university assessment, document assumptions, examples, grammar transformations, conflict decisions, test results and limitations. Compare the implementation with the formal description and justify any discrepancies.'
      ] }
    ],
    example: {
      title: 'Test valid and invalid assignments',
      introduction: 'The default language accepts one or more assignments such as x=42;. Each assignment ends with a semicolon.',
      steps: ['accept:x=42; should pass because NAME, ASSIGN, NUMBER and SEMI appear in the required order.', 'reject:x=; should pass as a test because SEMI appears where NUMBER is required: this is a syntax error.', 'reject:x=@; should pass as a test because @ has no lexical rule.', 'reject: tests the empty input, which this grammar rejects because it requires at least one assignment.', 'Change the first expectation to reject: and rerun: the row should fail because the parser accepts the input.'],
      conclusion: 'A passing test means the observed outcome matched its expectation; it does not mean every input was accepted.',
      preset: { kind: 'testing', cases: 'accept:x=42;\nreject:x=;\nreject:x=@;\nreject:' }
    },
    references: [parsing, scanning, { ...cornell, focus: 'Use the compiler notes as a reference for the distinction between analysis phases.' }]
  }
};
