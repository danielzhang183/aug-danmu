function offInDestroy(
  object,
  event,
  fn,
  offEvent,
) {
  function onDestroy() {
    object.off(event, fn)
    object.off(offEvent, onDestroy)
  }
  object.once(offEvent, onDestroy)
}

export function attachEventListener(
  object,
  event,
  fn,
  offEvent,
) {
  if (offEvent) {
    object.on(event, fn)
    offInDestroy(object, event, fn, offEvent)
  }
  else {
    const _fn = (data) => {
      fn(data)
      object.off(event, _fn)
    }
    object.on(event, _fn)
  }
}
