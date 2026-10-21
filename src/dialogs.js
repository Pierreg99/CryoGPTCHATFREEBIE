// Native modal semantics supply focus trapping and Escape; text never becomes HTML.
function ask(message, initial) {
  return new Promise((resolve) => {
    const previous = document.activeElement;
    const dialog = document.createElement("dialog");
    dialog.className = "cryo-dialog";
    const form = document.createElement("form");
    form.method = "dialog";
    const kicker = document.createElement("div");
    kicker.className = "eyebrow";
    kicker.textContent = "DEINE ENTSCHEIDUNG";
    const title = document.createElement("h2");
    title.id = "cryo-dialog-title";
    title.textContent =
      initial === undefined ? "Aktion bestätigen" : "Eingabe bestätigen";
    const description = document.createElement("p");
    description.id = "cryo-dialog-description";
    description.textContent = message;
    dialog.setAttribute("aria-labelledby", title.id);
    dialog.setAttribute("aria-describedby", description.id);
    form.append(kicker, title, description);
    let input;
    if (initial !== undefined) {
      const label = document.createElement("label");
      label.textContent = "Deine Eingabe";
      label.htmlFor = "cryo-dialog-input";
      input = document.createElement("input");
      input.id = label.htmlFor;
      input.type = "text";
      input.value = initial;
      input.maxLength = 140;
      form.append(label, input);
    }
    const actions = document.createElement("div");
    actions.className = "dialog-actions";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = "Abbrechen";
    cancel.addEventListener("click", () => dialog.close("cancel"));
    const confirm = document.createElement("button");
    confirm.id = "cryo-dialog-confirm";
    confirm.type = "submit";
    confirm.textContent = initial === undefined ? "Bestätigen" : "Übernehmen";
    confirm.value = "confirm";
    actions.append(cancel, confirm);
    form.append(actions);
    dialog.append(form);
    document.body.append(dialog);
    dialog.addEventListener(
      "close",
      () => {
        const accepted = dialog.returnValue === "confirm";
        const value = input?.value;
        dialog.remove();
        if (previous?.isConnected) previous.focus();
        resolve(initial === undefined ? accepted : accepted ? value : null);
      },
      { once: true },
    );
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (
          event.clientX < r.left ||
          event.clientX > r.right ||
          event.clientY < r.top ||
          event.clientY > r.bottom
        )
          dialog.close("cancel");
      }
    });
    dialog.showModal();
    (input || cancel).focus();
    input?.select();
  });
}
export const confirmAction = (message) => ask(message);
export const requestText = (message, initial = "") => ask(message, initial);
