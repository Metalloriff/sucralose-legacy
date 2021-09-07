import React from "react";
import App from "../App";
import { Serializer } from "../Constants";
import ContextMenu from "./ContextMenuHandler";
import LinkWrapper from "./LinkWrapper";
import "./PostTagsList.scss";
import SearchBar from "./SearchBar";

export class PostTagContextMenu extends React.Component {
	searchBar = document.getElementsByClassName("SearchBar")[0];

	searchContains() {
		return this.searchBar.textContent.includes(this.props.tag);
	}

	handleClick(e) {
		switch (e.target.id) {
			case "search":
				this.searchBar.textContent += " " + this.props.tag;
				this.searchBar.parentElement.classList.add("Focused");
				break;
			case "unsearch":
				this.searchBar.textContent = this.searchBar.textContent.split(this.props.tag).join("");
				break;

			case "subscribe":
				App.settings.subscriptions.push(this.props.tag);
				break;
			case "unsubscribe":
				App.settings.subscriptions.splice(App.settings.subscriptions.indexOf(this.props.tag), 1);
				break;
			
			case "blacklist":
				App.settings.blacklist.push(this.props.tag);
				break;
			case "unblacklist":
				App.settings.blacklist.splice(App.settings.blacklist.indexOf(this.props.tag), 1);
				break;
		}

		App.saveSettings();
		this.forceUpdate();
	}

	render() {
		return (
			<ContextMenu onClick={e => this.handleClick(e)}>
				{ !this.searchContains() ?
					(<ContextMenu.Item id="search">Add To Search</ContextMenu.Item>) :
					(<ContextMenu.Item id="unsearch">Remove From Search</ContextMenu.Item>)
				}

				<ContextMenu.Divider/>

				{ !App.settings.subscriptions.includes(this.props.tag) ?
					(<ContextMenu.Item id="subscribe">Subscribe To Tag</ContextMenu.Item>) :
					(<ContextMenu.Item id="unsubscribe">Unsubscribe To Tag</ContextMenu.Item>)
				}

				{ !App.settings.blacklist.includes(this.props.tag) ?
					(<ContextMenu.Item id="blacklist">Add To Blacklist</ContextMenu.Item>) :
					(<ContextMenu.Item id="unblacklist">Remove From Blacklist</ContextMenu.Item>)
				}
			</ContextMenu>
		);
	}
}

export default class extends React.Component {
	render() {
		const { tags } = this.props

		return (
			<div className="PostTags">
				{ Object.keys(tags).map(category => (
					["invalid", "lore", "meta"].includes(category) && tags[category].length === 0 ? null :
					(<div key={category} className="CategoryLabel">
						<b>{ category.replace(/^[a-z]/, c => c.toUpperCase()) }</b>

						{ tags[category].length > 0 ? 
							tags[category].map(tag => (
								<ContextMenu.Wrapper key={tag} menu={<PostTagContextMenu tag={tag}/>}>
									<LinkWrapper href={"#/search/" + tag}>
										<div className="Tag">{ tag }</div>
									</LinkWrapper>
								</ContextMenu.Wrapper>
							))
						 : (<div className="TagPlaceholder">No tags here.</div>) }
					</div>)
				)) }
			</div>
		);
	}
}