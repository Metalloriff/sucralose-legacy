import PostList from "./Components/PostList";
import Toasts from "./Components/Toasts";

Object.find = function(obj, path) {
	let r = obj;
	let p = path.split(".");

	for (let k of p) {
		if (r) {
			r = r[k];
		}
	}

	return r;
}

const _fetch = fetch;
let lastDidApi = -600;
fetch = async function() {
	if (performance.now() - lastDidApi < 600)
		await new Promise(r => setTimeout(r, 600));
	lastDidApi = performance.now();

	return await _fetch.call(window, ...arguments);
};

const API = {
	login: {
		login: localStorage.getItem("username"),
		api_key: localStorage.getItem("apiKey")
	},

	endpoint: function(sub, args = {}, explicitSub = false) {
		let login = this.login;

		if (!login.login || !login.api_key)
			login = {};
		
		Object.assign(args, { ...login, _client: "Sucralose/1.0 by roclo" })

		let query = "";

		for (let a in args) {
			if (query.length > 0)
				query += "&";

			query += a + "=" + args[a];
		}

		return "https://e621.net/" + sub + (explicitSub ? "?" : ".json?") + query;
	},

	fetchLocalUserId: async function() {
		try {
			const res = await fetch(this.endpoint("users/home", {}, true));
			const html = await res.text();
			const dom = new DOMParser().parseFromString(html, "text/html");

			if (dom.getElementsByClassName("guest-warning").length > 0)
				return null;
			
			const profileButton = [...dom.getElementsByClassName("link-page")[0].getElementsByTagName("a")]
				.find(a => a.innerText === "My profile" && a.pathname.startsWith("/users/"));

			if (profileButton)
				return profileButton.pathname.split("/")[2];
			return null;
		} catch (err) {
			console.error(err);
			return null;
		}
	}
};

export function formatCamelCase(camelCase) {
	const r = camelCase.replace(/([A-Z])/g, " $1");

	return r.charAt(0).toUpperCase() + r.slice(1);
}

const Serializer = {
	load: function(key, fallback = null, isObject = true) {
		const string = localStorage.getItem(key);

		if (isObject)
			return string === null ? fallback : JSON.parse(string);
		return string === null ? fallback : string;
	},

	save: function(key, data, isObject = true) {
		if (isObject)
			return localStorage.setItem(key, JSON.stringify(data));
		return localStorage.setItem(key, data);
	}
};

const Order = {
	Default: "",
	Random: "order:random",
	Score: "order:score",
	FavCount: "order:favcount",
	TagCount: "order:tagcount",
	Resolution: "order:mpixels",
	FileSize: "order:filesize"
};

function url(url) {
	return `url(${url})`;
}

function getPageArgs(sub) {
	const split = window.location.hash.split("?")[0].split("/");
	const i = split.indexOf(sub);

	return i === -1 ? "" : decodeURIComponent(split[i + 1] || "");
}

function setPageArgs(sub, to) {
	const split = window.location.hash.split("/");
	const i = split.indexOf(sub);

	if (i !== -1 && split[i + 1]) {
		split[i + 1] = encodeURIComponent(to);

		return split.join("/");
	}

	return `${window.location.hash}${window.location.hash.endsWith("/") ? "" : "/"}${sub}/${encodeURIComponent(to)}`;
}

function bytesToString(bytes) {
	const suf = ["bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));

	return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + suf[i];
}

function download(uri) {
	fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(uri)}`)
		.then(res => res.blob())
		.then(blob => {
			const a = Object.assign(document.createElement("a"), {
				style: { display: "none" },
				href: URL.createObjectURL(blob),
				download: uri.split("/")[uri.split("/").length - 1]
			});
			
			document.body.appendChild(a);
			a.click();
			
			window.URL.revokeObjectURL(a.href);
			a.remove();
		})
		.catch(err => (console.error(err), Toasts.showToast("Failed to save image!", "Failure")));
}

const Query = {
	convert: () => {
		const query = (document.location.href.split("?")[1] || "").split("&");
		const ret = {};

		for (let q of query) {
			const [ key, value ] = q.split("=");

			if (!key || !value)
				continue;

			ret[key] = value;
		}

		return ret;
	},

	set: (key, value) => {
		key = encodeURIComponent(key);
		value = encodeURIComponent(value);

		const query = Query.convert();
		query[key] = value;

		let q = "";
		for (let k in query) {
			if (!k || !query[k]?.length)
				continue;

			q += `${q.length === 0 ? "?" : "&"}${k}=${query[k]}`;
		}
		
		const newHref = window.location.href.split("?")[0] + q;
		
		if (window.location.href === newHref)
			return query;

		window.history.pushState({}, "", newHref);
		return query;
	},

	get: key => Query.convert()[key]
};

function getSiteBase() {
	return window.location.hostname === "localhost" ? window.location.origin : window.location.origin + "/sucralose"; 
}

export { API, Serializer, Order, url, getPageArgs, setPageArgs, bytesToString, download, Query, getSiteBase };