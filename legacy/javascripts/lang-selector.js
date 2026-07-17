// Corner language selector + translation of the static texts of the classic
// game. Uses window.BI18N (generated into vendor/i18n.js from the shared
// catalog). Changing language reloads the page so every text re-renders.
(function () {
	if (!window.BI18N) return;
	var I = window.BI18N;

	document.addEventListener("DOMContentLoaded", function () {
		document.title = I.t("classicTitle");

		// initial HUD texts (re-written later by the game itself)
		var timer = document.getElementById("timer_c");
		if (timer) timer.textContent = I.fmt("seconds", { n: 30 });
		var pts = document.querySelector(".timer_c:not(#timer_c)");
		if (pts) pts.textContent = I.fmt("points", { n: 0 });
		var racha = document.getElementById("racha");
		if (racha) racha.textContent = I.fmt("streak", { n: 0 });

		var backText = document.querySelector(".back-text");
		if (backText) backText.textContent = I.t("back");
		var footer = document.querySelector(".site-footer");
		if (footer) {
			footer.childNodes[0].textContent = I.t("madeBy") + " ";
			var link = footer.querySelector("a");
			if (link) link.textContent = I.t("source");
		}

		// corner selector, same placement as the homepage one
		var current = null;
		for (var i = 0; i < I.langs.length; i++) {
			if (I.langs[i].code === I.lang) current = I.langs[i];
		}
		current = current || I.langs[0];

		var root = document.createElement("div");
		root.className = "lang-sel-classic";
		var options = "";
		for (var j = 0; j < I.langs.length; j++) {
			var l = I.langs[j];
			options +=
				'<button type="button" data-code="' + l.code + '"' +
				(l.code === I.lang ? ' class="active"' : "") + ">" +
				l.flag + " " + l.name + "</button>";
		}
		root.innerHTML =
			'<button type="button" class="lang-toggle">🌐 ' +
			current.flag + " " + current.code.toUpperCase() +
			'</button><div class="lang-panel" hidden>' + options + "</div>";
		document.body.appendChild(root);

		var toggle = root.querySelector(".lang-toggle");
		var panel = root.querySelector(".lang-panel");
		toggle.addEventListener("click", function (e) {
			e.stopPropagation();
			panel.hidden = !panel.hidden;
		});
		document.addEventListener("click", function () {
			panel.hidden = true;
		});
		panel.addEventListener("click", function (e) {
			var btn = e.target.closest("[data-code]");
			if (!btn) return;
			try {
				localStorage.setItem("bubbles.lang", btn.getAttribute("data-code"));
			} catch (err) {}
			location.reload();
		});
	});
})();
