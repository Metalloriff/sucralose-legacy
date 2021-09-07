import React, { createRef, useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import "./App.scss";
import Dropdown from "./Components/Dropdown";
import { closeModal, Modals, openModal } from "./Components/Modals";
import PostList from "./Components/PostList";
import SearchBar from "./Components/SearchBar";
import { API, getPageArgs, getSiteBase, Order, Query, Serializer } from "./Constants";

import PostPage from "./Pages/Post";
import SettingsPage, { SettingsRenderer } from "./Pages/Settings";
import SetsPage from "./Pages/Sets";
import UserPage from "./Pages/User";

import SidebarIcon from "./Icons/Sidebar.svg";
import Toasts from "./Components/Toasts";
import LinkWrapper from "./Components/LinkWrapper";
import EventListener from "./EventListener";
import PostModal from "./Components/PostModal";
import {
	faBell,
	faChartLine,
	faCog,
	faHeart,
	faHistory,
	faLayerGroup,
	faUser
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ContextMenu from "./Components/ContextMenuHandler";

/*
	TODO finish user page
	TODO add pool functionality
	TODO visited posts history page
	TODO add option to flip sidebar button position 
 */

class Sidebar extends React.Component {
	state = { open: false };

	componentDidMount() {
		Sidebar.instance = this;
	}

	toggle() {
		this.setState({ open: !this.state.open });

		if (this.state.open)
			Sidebar.buttonRef.current.classList.remove("Open");
		else
			Sidebar.buttonRef.current.classList.add("Open");
	}
	
	SidebarButton({ href, icon, children, onClick }) {
		return (
			<LinkWrapper href={href} onClick={onClick}>
				<div className="SidebarButton">
					<FontAwesomeIcon icon={icon} className="Icon"/>
					
					{ children }
				</div>
			</LinkWrapper>
		);
	}

	render() {
		return (
			<div className={"SidebarContainer" + (this.state.open ? " Open" : "")} onClick={e => { if (e.target === e.currentTarget) this.toggle(); }}>
				<div className="Sidebar">
					<this.SidebarButton href={`${getSiteBase()}/#/search/`} onClick={() => App.forceUpdate()} icon={faHistory}>Recent Posts</this.SidebarButton>
					<this.SidebarButton href={`${getSiteBase()}/#/search/order:rank/`} icon={faChartLine} onClick={() => App.forceUpdate()}>Hot Posts</this.SidebarButton>
					<this.SidebarButton href={`${getSiteBase()}/#/`} icon={faBell}>Subscriptions</this.SidebarButton>
					<this.SidebarButton href={`${getSiteBase()}/#/favorites/`} icon={faHeart}>Favorites</this.SidebarButton>
					<this.SidebarButton href={`${getSiteBase()}/#/sets/`} icon={faLayerGroup}>Sets</this.SidebarButton>
					<this.SidebarButton onClick={() => Toasts.showToast("Not yet added!", "Failure")} icon={faUser}>Account</this.SidebarButton> {/*href={`${getSiteBase()}/#/account/`}*/}
					<this.SidebarButton href={`${getSiteBase()}/#/settings/`} icon={faCog}>Settings</this.SidebarButton>
				</div>
			</div>
		);
	}
}

Sidebar.buttonRef = createRef();

window.search = tags => {
	window.location.assign("#/search/" + encodeURIComponent(tags));

	PostList.instance && PostList.instance.setState({ fetch: true });
	App.forceUpdate();
};

let hash = window.location.hash;

window.events = new EventListener();
window.onpopstate = e => window.events.invoke("popstate", e);
window.events.subscribe("popstate", async e => {
	const lastHash = hash.split("?")[0];
	hash = window.location.hash.split("?")[0];
	
	if (hash.split("/")[1] !== lastHash.split("/")[1])
		return App.forceUpdate();
	
	const post = getPageArgs("post");
	if (post?.length && (!PostModal.current || PostModal.current.state?.post?.id !== post))
		return; // TODO open post from history
	
	// Get the current page from the query string.
	const currentPage = Query.get("page") || 1;
	// If the current page is different from the PostList's current page, force refresh.
	PostList.current && currentPage !== PostList.current.state.page && PostList.instance.setState({ fetch: true });
});

export default function App() {
	const isMobile = useMediaQuery({ query: "(max-width: 1224px)" });

	let username = localStorage.getItem("username");
	let apiKey = localStorage.getItem("apiKey");

	App.showNotice = function(text) {
		openModal(
			<div className="ClipboardModal" onClick={() => closeModal()}>
				<span>
					{ text }
				</span>
			</div>
		);
	};
		
	App.promptLogin = function(msg) {
		openModal(
			<div className="LoginModalContainer">
				<div className="LoginModal">
					<div className="Label">
						{ msg }
						<br/>
						In order to login, you will need your username and your <span className="Link">API key</span>.
					</div>

					<input className="Field" placeholder="Username" onChange={e => username = e.target.value}/>
					<input className="Field" placeholder="API key" onChange={e => apiKey = e.target.value}/>
					
					<div className="Buttons">
						<div className="Button" onClick={() => tryLogin()}>Login</div>
						<div className="Button" onClick={() => closeModal()}>Cancel</div>
					</div>
				</div>
			</div>
		);
	}

	async function tryLogin() {
		if (!username)
			return App.showNotice("Your username must not be empty!");
		if (!apiKey)
			return App.showNotice("Your API key must not be empty!");
		
		try {
			const args = { login: username, api_key: apiKey };
			const res = await fetch(API.endpoint("posts", { limit: 0, ...args }));
			const data = await res.json();

			if (data.success === false)
				return App.showNotice("Failed to login! Please try again.\nNote: Your API key is not your password!");
			
			API.login = args;

			localStorage.setItem("username", username);
			localStorage.setItem("apiKey", apiKey);

			window.location.reload();
		} catch (err) {
			App.showNotice("There was an error logging in, check your credentials and try again! Note: Your API key is not your password!");
			console.error(err);
		}
	}

	useEffect(() => {
		if (!username || !apiKey) {
			setTimeout(() => {
				if (localStorage.getItem("api_key") === null) {
					openModal(
						<div className="LoginModalContainer">
							<div className="LoginModal">
								<div className="Label">
									It appears you're not logged in, if you would like to login,
									you will need your username and your <span className="Link">API key</span>.
								</div>
			
								<input className="Field" placeholder="Username" onChange={e => username = e.target.value}/>
								<input className="Field" placeholder="API key" onChange={e => apiKey = e.target.value}/>
								
								<div className="Buttons">
									<div className="Button" onClick={() => tryLogin()}>Login</div>
									<div className="Button" onClick={() => closeModal()}>Not Now</div>
									<div className="Button" onClick={() => localStorage.setItem("api_key", "")}>Never Show Again</div>
								</div>
							</div>
						</div>
					);
				}
			}, 1000);
		}
	});
	
	const [, forceUpdate] = React.useReducer(x => x + 1, 0);
	App.forceUpdate = forceUpdate;

	App.settings = Serializer.load("settings", {
		subscriptions: [],
		blacklist: []
	});

	App.saveSettings = () => Serializer.save("settings", App.settings);

	App.importSettings = () => {
		const input = document.createElement("input");

		input.type = "file";
		input.accept = ".json";

		input.addEventListener("change", () => {
			const { files } = input;

			if (files[0]) {
				new Response(files[0]).json().then(data => {
					localStorage.clear();

					for (const key in data) {
						localStorage[key] = data[key];
					}

					window.location.reload();
				}).catch(() => App.showNotice("Error importing file!"));
			}
		});

		document.body.appendChild(input);
		input.click();
	};

	App.exportSettings = () => {
		const url = URL.createObjectURL(new Blob([ JSON.stringify(localStorage, null, "\t") ], { type: "json" }));
		const a = document.createElement("a");

		a.href = url;
		a.download = "sucraloseSettings.json";

		document.body.appendChild(a);

		a.click();

		setTimeout(() => {
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		}, 0);
	};

	App.loggedIn = () => API.login && API.login.login && API.login.api_key;

	if (!App.init) {
		(App.init = async () => {
			if (App.loggedIn()) {
				App.localUserId = await API.fetchLocalUserId();
	
				if (!App.localUserId)
					return;
	
				(App.init.postSets = async () => {
					const res = await fetch(API.endpoint("post_sets", { "search[creator_id]": App.localUserId }));
					App.postSets = await res.json();
				})();
			}
		})();
	}

	const HomePage = () => (<PostList tags={!App.settings.subscriptions ?
		null : App.settings.subscriptions.filter(tag => tag.split(" ").length === 1).map(tag => "~" + tag).join(" ")}/>);
	const SearchPage = () => (<PostList/>);
	const FavoritesPage = () => (<PostList endpoint="favorites" endpointArgs={{}}/>);
	
	let Page;
	
	switch (window.location.hash.split("/")[1]) {
		default: Page = <HomePage/>; break;
		case "search": Page = <SearchPage/>; break;
		case "favorites": Page = <FavoritesPage/>; break;
		case "sets":
			Page = window.location.hash.split("/")[2] === "create"
				? <SetsPage.CreatePage/>
				: <SetsPage.MainPage/>;
			break;
		case "post": Page = <PostPage/>; break;
		case "user": Page = <UserPage/>; break;
		case "settings": Page = <SettingsPage/>; break;
	}

	return (
		<div className={"App " + (isMobile ? "Mobile" : "Desktop")}>
			<Sidebar/>

			<div>
				<header className="Header">
					<img className="SidebarIcon" src={SidebarIcon} ref={Sidebar.buttonRef} onClick={() => Sidebar.instance.toggle()} alt="Sidebar"/>
					<span className="HeaderMain">Sucralose!</span>

					<SearchBar>
						<Dropdown value={0} items={Object.keys(Order).map(key => ({ key, value: Order[key], label: "Order: " + key }))} callback={e => {
							PostList.instance && PostList.instance.setState({ order: e.state.value, fetch: PostList.instance.state.order !== e.state.value });
						}}/>
					</SearchBar>
				</header>

				<div className="Main">
					{Page}
				</div>

				<footer className="Footer">
					<span>Default Theme, <a href="https://metalloriff.github.io/city-fog/">City Fog</a></span>

					<div className="Divider"/>
					
					<span>© Copyright 2020-{new Date().getFullYear()} Metalloriff</span>
				</footer>
			</div>

			<Modals/>
			<Toasts/>
			<ContextMenu.Handler/>
			<SettingsRenderer/>
		</div>
	);
}