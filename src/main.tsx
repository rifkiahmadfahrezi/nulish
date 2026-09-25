import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "#/app/App";
import "#/styles.css";

// biome-ignore lint/style/noNonNullAssertion: #root ada di index.html
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
