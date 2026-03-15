// ═══════════════════════════════════════════════════════════════
// BIT-SOUL — Input Manager (Keyboard + Mouse)
// ═══════════════════════════════════════════════════════════════

export type InputAction =
  | 'move_up' | 'move_down' | 'move_left' | 'move_right'
  | 'dash' | 'attack' | 'sprint'
  | 'ability_1' | 'ability_2' | 'ability_3' | 'ability_4'
  | 'pause' | 'minimap';

const KEY_BINDINGS: Record<string, InputAction> = {
  'KeyW': 'move_up',
  'ArrowUp': 'move_up',
  'KeyS': 'move_down',
  'ArrowDown': 'move_down',
  'KeyA': 'move_left',
  'ArrowLeft': 'move_left',
  'KeyD': 'move_right',
  'ArrowRight': 'move_right',
  'Space': 'dash',
  'ShiftLeft': 'sprint',
  'ShiftRight': 'sprint',
  'KeyQ': 'ability_1',
  'KeyE': 'ability_2',
  'KeyR': 'ability_3',
  'KeyF': 'ability_4',
  'Escape': 'pause',
  'KeyM': 'minimap',
};

export class InputManager {
  private keys = new Set<string>();
  private justPressed = new Set<string>();
  private mouseX = 0;
  private mouseY = 0;
  private mouseDown = false;
  private mouseClicked = false;
  private rightMouseDown = false;
  private attached = false;
  private canvas: HTMLCanvasElement | null = null;

  attach(canvas: HTMLCanvasElement): void {
    if (this.attached) return;
    this.canvas = canvas;
    this.attached = true;

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('mousedown', this.onMouseDown);
    canvas.addEventListener('mouseup', this.onMouseUp);
    canvas.addEventListener('contextmenu', this.onContextMenu);
  }

  detach(): void {
    if (!this.attached) return;
    this.attached = false;
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this.onMouseMove);
      this.canvas.removeEventListener('mousedown', this.onMouseDown);
      this.canvas.removeEventListener('mouseup', this.onMouseUp);
      this.canvas.removeEventListener('contextmenu', this.onContextMenu);
    }
  }

  /** Call at end of each frame to clear one-shot inputs */
  endFrame(): void {
    this.justPressed.clear();
    this.mouseClicked = false;
  }

  isDown(action: InputAction): boolean {
    return [...this.keys].some(k => KEY_BINDINGS[k] === action);
  }

  wasPressed(action: InputAction): boolean {
    return [...this.justPressed].some(k => KEY_BINDINGS[k] === action);
  }

  isMouseDown(): boolean { return this.mouseDown; }
  isRightMouseDown(): boolean { return this.rightMouseDown; }
  wasMouseClicked(): boolean { return this.mouseClicked; }
  getMousePos(): { x: number; y: number } { return { x: this.mouseX, y: this.mouseY }; }

  // ── Event handlers (arrow functions for correct `this`) ──
  private onKeyDown = (e: KeyboardEvent): void => {
    if (KEY_BINDINGS[e.code]) {
      e.preventDefault();
      if (!this.keys.has(e.code)) {
        this.justPressed.add(e.code);
      }
      this.keys.add(e.code);
    }
    // Track shift even if not in bindings fallback
    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private onMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas!.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button === 0) { this.mouseDown = true; this.mouseClicked = true; }
    if (e.button === 2) { this.rightMouseDown = true; }
  };

  private onMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) this.mouseDown = false;
    if (e.button === 2) this.rightMouseDown = false;
  };

  private onContextMenu = (e: Event): void => {
    e.preventDefault();
  };
}
