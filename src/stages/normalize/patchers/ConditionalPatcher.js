import NodePatcher from '../../../patchers/NodePatcher.js';
import type { Node, ParseContext, Editor } from './../../../patchers/types.js';

/**
 * Normalizes conditionals by rewriting post-`if` into standard `if`, e.g.
 *
 *   return [] unless list?
 *
 * becomes
 *
 *   unless list? then return []
 */
export default class ConditionalPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, condition: NodePatcher, consequent: NodePatcher, alternate: ?NodePatcher) {
    super(node, context, editor);
    this.condition = condition;
    this.consequent = consequent;
    this.alternate = alternate;
  }

  patchAsExpression() {
    if (this.isPostIf()) {
      this.patchPostIf();
    } else {
      this.condition.patch();
      this.consequent.patch();
    }
  }

  /**
   * `CONSEQUENT 'if' CONDITION` → `if CONDITION then CONSEQUENT`
   * `CONSEQUENT 'unless' CONDITION` → `unless CONDITION then CONSEQUENT`
   */
  patchPostIf() {
    this.consequent.patch();
    this.condition.patch();
    let patchedCondition = this.slice(
      this.condition.before,
      this.condition.after
    );
    let patchedConsequent = this.slice(
      this.consequent.before,
      this.consequent.after
    );
    let ifToken = this.node.isUnless ? 'unless' : 'if';
    this.overwrite(
      this.start,
      this.end,
      `${ifToken} ${patchedCondition} then ${patchedConsequent}`
    );
  }

  patchAsStatement() {
    this.patchAsExpression();
  }

  isPostIf(): boolean {
    return this.condition.start > this.consequent.start;
  }
}