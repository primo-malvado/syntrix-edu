import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UpperCasePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { Subscription } from 'rxjs';
import { lessons, type Lesson } from './course-data';
import type { ExamplePreset } from './course-study';
import { MachineDiagramComponent } from './machine-diagram.component';
import type { Job, Reply, Result } from './course-model';

const lexer = `NUMBER = "0".."9", { "0".."9" };
PLUS = "+";
STAR = "*";
LP = "(";
RP = ")";
SPACE = (" " | "\\t" | "\\n"), { " " | "\\t" | "\\n" };`;
const grammar = `entry = expr { $$ = $1; };
expr = expr, PLUS, term { $$ = { type: "add", left: $1, right: $3 }; }
     | term { $$ = $1; };
term = term, STAR, factor { $$ = { type: "multiply", left: $1, right: $3 }; }
     | factor { $$ = $1; };
factor = NUMBER { $$ = { type: "number", value: Number($1) }; }
       | LP, expr, RP { $$ = $2; };`;
const lrGrammar = `entry = expr;
expr = expr, PLUS, term | term;
term = term, STAR, factor | factor;
factor = NUMBER | LP, expr, RP;`;
const testLexer = `NAME = "a".."z", { "a".."z" };
NUMBER = "0".."9", { "0".."9" };
ASSIGN = "=";
SEMI = ";";
SPACE = (" " | "\\t" | "\\n"), { " " | "\\t" | "\\n" };`;
const testGrammar = `program = assignment, { assignment };
assignment = NAME, ASSIGN, NUMBER, SEMI;`;

function defaultJob(lesson: Lesson): Job {
  if (lesson.lab === 'automata') return lesson.id === 'foundations'
    ? { kind: 'automata', regex: '(a|b)*', input: 'abba' }
    : { kind: 'automata', regex: 'a(b|c)*', input: 'abcb' };
  if (lesson.lab === 'lexer') return { kind: 'lexer', lexer, tokens: 'NUMBER PLUS STAR LP RP SPACE', input: '2 + 3 * 4' };
  if (lesson.lab === 'grammar' && lesson.id === 'grammars') return {
    kind: 'grammar', grammar: 'entry = A, [ B ], { C };', start: 'entry', tokens: 'A B C', input: ''
  };
  if (lesson.lab === 'grammar') return {
    kind: 'grammar', grammar: 'entry = A, tail;\ntail = A, tail | B;', start: 'entry', tokens: 'A B', input: 'A A B'
  };
  if (lesson.lab === 'testing') return {
    kind: 'testing', lexer: testLexer, lexerTokens: 'NAME NUMBER ASSIGN SEMI SPACE',
    grammar: testGrammar, start: 'program', tokens: 'NAME NUMBER ASSIGN SEMI', ignore: 'SPACE',
    cases: 'accept:x=42;\naccept:x=1;y=2;\nreject:x=;\nreject:x=@;\nreject:'
  };
  return {
    kind: 'parser', lexer, lexerTokens: 'NUMBER PLUS STAR LP RP SPACE',
    grammar: lesson.id === 'lr-parsing' ? lrGrammar : grammar, start: 'entry',
    tokens: 'NUMBER PLUS STAR LP RP', ignore: 'SPACE', input: lesson.id === 'lr-parsing' ? '1 + 2 * 3' : '4 * (2 + 3)', algorithm: 'lalr1'
  };
}

@Component({
  selector: 'course-lesson',
  standalone: true,
  imports: [FormsModule, RouterLink, UpperCasePipe, MachineDiagramComponent],
  templateUrl: './lesson.component.html'
})
export class LessonComponent implements OnDestroy {
  readonly lessons = lessons;
  lesson = lessons[0];
  job: Job = defaultJob(this.lesson);
  result: Result | null = null;
  error = '';
  running = false;
  dirty = false;
  private readonly drafts = new Map<string, Job>();
  private worker: Worker | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly subscription: Subscription;

  constructor(route: ActivatedRoute, private readonly cdr: ChangeDetectorRef) {
    this.subscription = route.paramMap.subscribe(params => {
      this.stopWorker();
      this.lesson = lessons.find(lesson => lesson.id === params.get('id')) ?? lessons[0];
      this.job = this.drafts.get(this.lesson.id) ?? defaultJob(this.lesson);
      this.drafts.set(this.lesson.id, this.job);
      this.result = null;
      this.error = '';
      this.dirty = false;
      this.run();
    });
  }

  get index(): number { return lessons.indexOf(this.lesson); }
  get previous(): Lesson | undefined { return lessons[this.index - 1]; }
  get next(): Lesson | undefined { return lessons[this.index + 1]; }

  markDirty(): void { this.dirty = true; }

  applyExample(preset: ExamplePreset): void {
    const base = defaultJob(this.lesson);
    switch (preset.kind) {
      case 'automata':
        if (base.kind !== 'automata') throw new Error('Example does not match the current lab.');
        this.job = { ...base, ...preset };
        break;
      case 'lexer':
        if (base.kind !== 'lexer') throw new Error('Example does not match the current lab.');
        this.job = { ...base, ...preset };
        break;
      case 'grammar':
        if (base.kind !== 'grammar') throw new Error('Example does not match the current lab.');
        this.job = { ...base, ...preset };
        break;
      case 'parser':
        if (base.kind !== 'parser') throw new Error('Example does not match the current lab.');
        this.job = { ...base, ...preset };
        break;
      case 'testing':
        if (base.kind !== 'testing') throw new Error('Example does not match the current lab.');
        this.job = { ...base, ...preset };
        break;
    }
    this.drafts.set(this.lesson.id, this.job);
    this.run();
  }

  reset(): void {
    this.job = defaultJob(this.lesson);
    this.drafts.set(this.lesson.id, this.job);
    this.run();
  }

  run(): void {
    this.stopWorker();
    this.running = true;
    this.result = null;
    this.error = '';
    this.dirty = false;
    try {
      const worker = new Worker(new URL('./course.worker.ts', import.meta.url), { type: 'module' });
      this.worker = worker;
      worker.onmessage = ({ data }: MessageEvent<Reply>) => {
        if (data.ok) this.result = data.result;
        else this.error = data.error;
        this.stopWorker();
        this.cdr.markForCheck();
      };
      worker.onerror = event => {
        this.error = `Worker failed: ${event.message}`;
        this.stopWorker();
        this.cdr.markForCheck();
      };
      this.timer = setTimeout(() => {
        this.error = 'The operation exceeded 10 seconds. Simplify the grammar or expression and try again.';
        this.stopWorker();
        this.cdr.markForCheck();
      }, 10_000);
      worker.postMessage(this.job);
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
      this.stopWorker();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.stopWorker();
  }

  private stopWorker(): void {
    this.worker?.terminate();
    this.worker = null;
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.running = false;
  }

  format(states: string[]): string { return states.length ? `{${states.join(', ')}}` : '∅'; }
  edgeLabel(first: string, last: string): string {
    const visible = (value: string) => /^\s+$/.test(value) ? JSON.stringify(value) : value;
    return first === last ? visible(first) : `${visible(first)}–${visible(last)}`;
  }
  lexeme(value: string): string { return JSON.stringify(value); }
  showSymbol(symbol: string): string { return symbol === 'eof' ? '$' : symbol; }
}
