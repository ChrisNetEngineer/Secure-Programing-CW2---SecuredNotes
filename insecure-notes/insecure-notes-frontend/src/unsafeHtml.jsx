import { useEffect, useRef } from "react";

export function UnsafeHtml({ as: Tag = "span", html, className }) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) {
      return;
    }

    root.innerHTML = html ?? "";

    for (const oldScript of [...root.querySelectorAll("script")]) {
      const script = document.createElement("script");
      for (const attribute of oldScript.attributes) {
        script.setAttribute(attribute.name, attribute.value);
      }
      script.text = oldScript.textContent ?? "";
      oldScript.replaceWith(script);
    }
  }, [html]);

  return <Tag ref={ref} className={className} />;
}

export function serverMessage(data, fallback) {
  return data?.detail || data?.error || fallback;
}
