/** Base class for reusable behaviors attached to entities. */
export class Component {
  constructor() {
    this.entity = null;
    this.enabled = true;
  }
  onAttach() {}
  onDetach() {}
  start() {}
  update(_dt) {}
  render(_ctx) {}
}