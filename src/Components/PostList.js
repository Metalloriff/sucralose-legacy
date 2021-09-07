import React from "react";
import App from "../App";
import { API, getPageArgs, Query, setPageArgs } from "../Constants";
import Post from "./Post";
import "./PostList.scss";
import SearchBar from "./SearchBar";
import Spinner from "../Icons/Spinner.svg";
import { openModal } from "./Modals";
import PostModal from "./PostModal";
import InlineLoading from "./InlineLoading";
import _ from "lodash";

let lastTags;

export default class PostList extends React.Component {
	currentPage = 1;
	state = { posts: [], fetch: true, switchingPages: false, order: "" };

	componentDidMount() {
		this.componentDidUpdate();

		PostList.instance = this;

		document.addEventListener("scroll", this.docScrollEv);

		if (Query.get("post"))
			this.openPostModalForId(Query.get("post"));
	}

	componentWillUnmount() {
		document.removeEventListener("scroll", this.docScrollEv);
	}
	
	lastLoaded = Date.now();
	pushPageState = _.debounce(() => {
		// If the time since the last loaded page is less than 2 seconds, do nothing.
		if (Date.now() - this.lastLoaded > 2000) {
			// Load the next page.
			this.loadPage(this.currentPage + 1)
				// Catch any exceptions.
				.catch(console.error.bind(null, "Failed to load next page"));
			
			// Set the last loaded time to now.
			this.lastLoaded = Date.now();
		}
	}, 100);

	docScrollEv = () => {
		// Get the document element
		const { documentElement } = document;
		
		// If scrolled to the end of the document, try to load the next page.
		documentElement.scrollTop >= documentElement.scrollHeight - window.innerHeight - 100
			&& this.pushPageState();
	};

	async openPostModalForId(id) {
		const { post } = await fetch(API.endpoint("posts/" + id)).then(r => r.json());

		openModal(<PostModal {...post}/>);
	}

	getTags() {
		// Jesus fucking christ this is hideous
		return (!this.props.tags ? "" : this.props.tags + " ") + getPageArgs("search")
			+ (App.settings.blacklist || []).map(tag => " -" + tag.split(" ").join(" -")).join(" ") + (this.state.order?.length ? ` ${this.state.order}` : "");
	}

	async componentDidUpdate() {
		let tags = getPageArgs("search");
		const page = parseInt(Query.get("page")) || 1;
		const bar = document.getElementsByClassName("SearchBar")[0];

		if (tags === "page")
			tags = "";

		if (bar) {
			bar.textContent = tags;
			
			if (tags.length > 0) {
				bar.parentElement.classList.add("Focused");
			}
		}

		if (this.state.fetch || (lastTags !== tags && lastTags)) {
			SearchBar.instance.setState({ searching: true });
			lastTags = tags;
			document.title = "Searching...";

			this.currentPage = 1;

			try {
				this.currentPage = page;

				const res = await fetch(API.endpoint(this.props.endpoint || "posts", this.props.endpointArgs || { tags: this.getTags(), page }));
				const posts = (await res.json()).posts || [];
	
				this.setState({ posts, fetch: false });
				SearchBar.instance.setState({ searching: false });

				switch (this.props.endpoint)
				{
					case "favorites":
						document.title = "Favorited | Sucralose!";
						break;
					default:
						document.title = tags + " | Sucralose!";
						break;
				}
			} catch (err) {
				console.error(err);
			}
		}
	}

	async loadPage(to, append = true) {
		this.setState({ switchingPages: true });

		let lastValidPage = this.currentPage;

		for (let page = this.currentPage + 1; page <= to; page++) {
			this.currentPage = page;
			
			const res = await fetch(API.endpoint(this.props.endpoint || "posts", Object.assign(this.props.endpointArgs || { tags: this.getTags() }, { page })));
			const posts = (await res.json()).posts;
	
			const cache = this.state.posts;
			cache[append ? "push" : "unshift"](...posts);
			
			if (posts.length > 0)
				lastValidPage = page;
	
			this.setState({ posts: cache, fetch: false });
		}

		this.currentPage = lastValidPage;

		this.setState({ switchingPages: false });
		Query.set("page", this.currentPage);
	}

	render() {
		return (
			<div className="PostList">
				{ [...this.state.posts]
					.filter(post => post.file.url)
					.map(post => (<Post key={post.id} {...post}/>)) }
				{ this.state.fetch || this.state.switchingPages ? (
					<div className="PostListFetchingOverlay">
						<InlineLoading/>
					</div>
				) : null }
			</div>
		);
	}
}