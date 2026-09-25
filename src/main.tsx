import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "#/app/App";
import { boot } from "#/app/boot";
import "#/styles.css";

boot().then(() => {
	// biome-ignore lint/style/noNonNullAssertion: #root is in index.html
	createRoot(document.getElementById("root")!).render(
		<StrictMode>
			<App />
		</StrictMode>,
	);
});
