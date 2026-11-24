import { Component, Input } from '@angular/core';
import type { Automaton } from 'syntrix';
import { layoutMachine, pathData, type MachineLayout } from './machine-layout';

@Component({
  selector: 'machine-diagram',
  standalone: true,
  template: `
    <div class="diagram-scroll">
      <svg [attr.viewBox]="'0 0 ' + diagram.width + ' ' + diagram.height"
           [style.min-width.px]="diagram.width > 500 ? diagram.width : 500" role="img" [attr.aria-label]="title">
        <defs><marker [attr.id]="markerId" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#9db99b"/></marker></defs>
        @for (start of diagram.starts; track $index) {
          <path [attr.d]="pathData(start)" fill="none" stroke="#b6ed81" stroke-width="2" [attr.marker-end]="'url(#' + markerId + ')'"/>
        }
        @for (edge of diagram.edges; track $index) {
          <path [attr.d]="pathData(edge.points)" fill="none" stroke="#9db99b" stroke-width="1.5" [attr.marker-end]="'url(#' + markerId + ')'"/>
          <text [attr.x]="edge.x" [attr.y]="edge.y + 4" text-anchor="middle" class="edge-label">{{ edge.label }}</text>
        }
        @for (node of diagram.nodes; track node.id) {
          <circle [attr.cx]="node.x" [attr.cy]="node.y" r="21" fill="#1b251c" stroke="#b6ed81" stroke-width="1.5"/>
          @if (node.accepting) { <circle [attr.cx]="node.x" [attr.cy]="node.y" r="17" fill="none" stroke="#b6ed81" stroke-width="1"/> }
          <text [attr.x]="node.x" [attr.y]="node.y + 4" text-anchor="middle" class="node-label">{{ node.id }}</text>
        }
      </svg>
    </div>
  `
})
export class MachineDiagramComponent {
  diagram: MachineLayout = { width: 100, height: 100, nodes: [], edges: [], starts: [] };
  readonly pathData = pathData;
  @Input({ required: true }) set machine(value: Automaton) { this.diagram = layoutMachine(value); }
  @Input() title = 'Automaton transition diagram';
  @Input() markerId = 'arrow';
}
