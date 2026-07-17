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
		var footerLinks = document.querySelectorAll(".site-footer a");
		if (footerLinks[0]) footerLinks[0].textContent = I.t("madeBy");
		if (footerLinks[1]) footerLinks[1].textContent = I.t("source");

		// corner selector, same structure as the homepage/kinegram picker:
		// flag + language name + caret, dropdown with a search box
		var current = null;
		for (var i = 0; i < I.langs.length; i++) {
			if (I.langs[i].code === I.lang) current = I.langs[i];
		}
		current = current || I.langs[0];

		var norm = function (str) {
			return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
		};

		var root = document.createElement("div");
		root.className = "lang-sel-classic";
		root.innerHTML =
			'<button type="button" class="lang-toggle">' +
			current.flag + ' <span class="lang-name">' + current.name + '</span> <span class="lang-caret">▾</span>' +
			'</button><div class="lang-panel" hidden><input type="search" class="lang-search" aria-label="Search" />' +
			'<div class="lang-list"></div></div>';
		document.body.appendChild(root);

		var toggle = root.querySelector(".lang-toggle");
		var panel = root.querySelector(".lang-panel");
		var search = root.querySelector(".lang-search");
		var list = root.querySelector(".lang-list");

		function render(query) {
			var q = norm(query || "");
			var html = "";
			for (var j = 0; j < I.langs.length; j++) {
				var l = I.langs[j];
				if (q && norm(l.name + " " + l.code + " " + (l.alias || "")).indexOf(q) === -1) continue;
				html +=
					'<button type="button" data-code="' + l.code + '"' +
					(l.code === I.lang ? ' class="active"' : "") + ">" +
					l.flag + " " + l.name + "</button>";
			}
			list.innerHTML = html;
		}
		render("");

		toggle.addEventListener("click", function (e) {
			e.stopPropagation();
			panel.hidden = !panel.hidden;
			if (!panel.hidden) {
				search.value = "";
				render("");
				search.focus();
			}
		});
		panel.addEventListener("click", function (e) {
			e.stopPropagation();
		});
		document.addEventListener("click", function () {
			panel.hidden = true;
		});
		search.addEventListener("input", function () {
			render(search.value);
		});
		search.addEventListener("keydown", function (e) {
			if (e.key === "Escape") panel.hidden = true;
			if (e.key === "Enter") {
				var first = list.querySelector("[data-code]");
				if (first) first.click();
			}
		});
		list.addEventListener("click", function (e) {
			var btn = e.target.closest("[data-code]");
			if (!btn) return;
			try {
				localStorage.setItem("bubbles.lang", btn.getAttribute("data-code"));
			} catch (err) {}
			location.reload();
		});
	});
})();
