import React from "react";
import "./SearchBar.scss";

import Spinner from "../Icons/Spinner.svg";
import Search from "../Icons/Search.svg";
import { API } from "../Constants";

export default class SearchBar extends React.Component {
	state = { searching: false, acResults: [] };

	componentDidMount() {
		SearchBar.instance = this;
	}

	handleKeyDown(e) {
		if (e.key === "Enter") {
			e.preventDefault();

			window.search(e.target.textContent);
		}
	}

	acUpdateInstance = -1;
	handleInput(e) {
		const { textContent } = e.target;

		clearTimeout(this.acUpdateInstance);

		this.acUpdateInstance = setTimeout(() => {
			this.handleAutoCompleteUpdate(textContent.split(" ")).catch(console.warn);
		}, 200);
	}

	async handleAutoCompleteUpdate(words) {
		const search = (words[words.length - 1] || "").replace(/(-|~)/g, "");

		if (!search)
			return this.setState({ acResults: [] });

		const res = await fetch(API.endpoint("tags", {
			commit: "Search",
			limit: 10,
			"search[hide_empty]": "yes",
			"search[name_matches]": search.replace(/\*/g, "") + "*",
			"search[order]": "count",
		}));
		const acResults = await res.json();

		this.setState({ acResults });
	}

	handleAutoCompleteSelect(tag) {
		const [ searchBar ] = document.getElementsByClassName("SearchBar");
		const content = searchBar.textContent.split(" ");
		content.pop();

		searchBar.textContent = `${content.join(" ")} ${tag}`;
		searchBar.focus();
		document.execCommand("selectAll", false, null);
		document.getSelection().collapseToEnd();

		this.setState({ acResults: [] });
	}

	handleFocusChange({ currentTarget: { parentElement, textContent } }, focused) {
		const [ autoComplete ] = parentElement.getElementsByClassName("AutoComplete");

		if (focused) {
			parentElement.classList.add("Focused");
			autoComplete.style.opacity = 1;
		} else {
			if (textContent.length === 0)
				parentElement.classList.remove("Focused");

			autoComplete.style.opacity = null;
		}
	}

	render() {
		const { acResults } = this.state;

		return (
			<div className="SearchBarContainer">
				<div contentEditable className="SearchBar"
					onKeyDown={e => this.handleKeyDown(e)}
					onFocus={e => this.handleFocusChange(e, true)}
					onBlur={e => this.handleFocusChange(e, false)}
					onInput={e => this.handleInput(e)}/>

				<img src={this.state.searching ? Spinner : Search} className={this.state.searching ? "Spinner" : null}
					onClick={e => window.search(e.target.previousSibling.textContent)}/>

				{ this.props.children }

				<div className="AutoComplete">
					{ acResults && acResults.length ? acResults.map(({ id, name, post_count }) => (
						<div className="Result" key={id} onClick={() => this.handleAutoCompleteSelect(name)}>
							<span className="Title">{ name }</span>
							<span>
								<span className="Count">{ post_count }</span>
								posts
							</span>
						</div>
					)) : null }
				</div>
			</div>
		);
	}
}