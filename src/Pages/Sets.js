import React from "react";
import App from "../App";
import ContextMenu from "../Components/ContextMenuHandler";
import LinkWrapper from "../Components/LinkWrapper";
import { PostTagContextMenu } from "../Components/PostTagsList";
import TabsList from "../Components/TabsList";
import { API } from "../Constants";
import "./Sets.scss";

export default class SetsPage extends React.Component {
	render() {
		return (
			<div className="SetsPage">

			</div>
		);
	}
}

class Field extends React.Component {
	handleKeyDown = e => {
		if (!this.props.multiline && e.key === "Enter") {
			return e.preventDefault();
		}
	}

	handleInput = e => {
		this.props.owner[this.props.id] = e.target.textContent;

		if (this.props.callback && this.props.callback(e))
			return e.preventDefault();
	}

	render() {
		return (
			<div className="Field">
				<div className="FTitle">{ this.props.title }</div>
				{ this.props.note ? (<div className="FNote">{ this.props.note }</div>) : null }
				{ this.props.importantNote ? (<div className="FNote Important">{ this.props.importantNote }</div>) : null }
				<div id={"err-note-" + this.props.id} className="FNote Error"/>
				<div contentEditable className="Input" style={this.props.multiline ? { height: 300 } : null} onKeyDown={this.handleKeyDown} onInput={this.handleInput}/>
			</div>
		);
	}
}

SetsPage.CreatePage = class extends React.Component {
	name = "";
	shortname = "";
	description = "";
	public = false;
	transferOnDelete = false;

	async post() {
		for (let err of document.getElementsByClassName("Error")) {
			err.innerHTML = "";
		}

		try {
			const res = await fetch(API.endpoint("post_sets", {
				"post_set[name]": this.name.split(" ").join("+"),
				"post_set[shortname]": this.shortname,
				"post_set[description]": this.description,
				"post_set[is_public]": this.public ? 1 : 0,
				"post_set[transfer_on_delete]": this.transferOnDelete ? 1 : 0,
				"commit": "Create"
			}), { method: "POST" });
			const data = await res.json();

			console.log(data);

			if (data.errors) {
				for (let id in data.errors) {
					const note = document.getElementById("err-note-" + id);

					if (note && data.errors[id]) {
						note.innerHTML = data.errors[id].map(err => "ERROR: " + err).join("<br/>");
					}
				}
			} else {
				App.postSets.push(data);
				window.location.assign("#/set/" + data.id);
			}
		} catch (err) {
			console.error(err);
		}
	}

	render() {
		return (
			<div className="SetsPage CreatePage">
				<div className="Fields">
					<Field owner={this} id="name" title="Display Name" note="Must be unique. There can only be one of each name."/>
					<Field owner={this} id="shortname" title="ID/Short Name" note="This is the set's metatag name. This will be used to find your set."
						importantNote="NOTE: Can only contain letters, numbers, and underscores and must contain at least one letter or underscore."/>
					<Field owner={this} id="description" multiline title="Description"/>

					<div className="Button" onClick={() => this.post()}>Create Set</div>
				</div>
			</div>
		);
	}
}

export class SetItemContextMenu extends React.Component {
	render() {
		const { id, creator_id } = this.props;

		return (
			<ContextMenu>
				<LinkWrapper href={"#/search/set:" + id}>
					<ContextMenu.Item>View Posts</ContextMenu.Item>
				</LinkWrapper>

				<ContextMenu.Divider/>

				<PostTagContextMenu tag={"set:" + id}/>

				{/* { creator_id === App.localUserId ? (
					<div>
						<ContextMenu.Divider/>

						<ContextMenu.Item style={{ color: "#ff0000" }} autoClose onClick={async () => {
							const res = await fetch(API.endpoint("post_sets/" + id, {}, true), { method: "POST", body: JSON.stringify({ _method: "delete" }) });
							const msg = await res.text();

							console.log(msg);
							App.showNotice("Successfully deleted set!");
							SetsPage.MainPage.instance.initMySets();
						}}>Delete Set</ContextMenu.Item>
					</div>
				) : null } */}
			</ContextMenu>
		)
	}
}

class Item extends React.Component {
	render() {
		const { id, name, shortname, creator_id, description, updated_at, post_count } = this.props;

		return (
			<ContextMenu.Wrapper menu={<SetItemContextMenu {...this.props}/>}>
				<LinkWrapper href={"#/search/set:" + id}>
					<div className="SetItem">
						<div className="STitle">
							{ name },
							<LinkWrapper href={"#/user/" + creator_id}>
								<span className="SCreator">
									created by { creator_id }
								</span>
							</LinkWrapper>
							<span className="SDate">
								Updated at { new Date(updated_at).toDateString() }, { new Date(updated_at).toLocaleTimeString() }
							</span>
						</div>
						<div className="SNote">{ shortname }</div>
						<div className="SNote">{ post_count } posts</div>

						{ description ? (<div className="SDesc">{ description }</div>) : null }
					</div>
				</LinkWrapper>
			</ContextMenu.Wrapper>
		)
	}
}

SetsPage.MainPage = class extends React.Component {
	page = 1;
	lastValidPage = this.page;
	state = { items: [], mySets: [], subscribedSets: [] };
	
	docScrollEv = () => {
		const footer = document.getElementsByClassName("Footer")[0];

		if (footer.getBoundingClientRect().bottom <= window.innerHeight && this.state.items.length > 0) {
			this.loadPage(this.page + 1);
		}
	}

	componentDidMount() {
		document.addEventListener("scroll", this.docScrollEv);
		document.title = "Post Sets | Sucralose!";

		this.initSets();
		this.initMySets();

		SetsPage.MainPage.instance = this;
	}

	async initSets() {
		const res = await fetch(API.endpoint("post_sets"));
		const items = await res.json();
		
		this.setState({ items });
	}

	async initMySets() {
		const localUserId = await API.fetchLocalUserId();
		const res = await fetch(API.endpoint("post_sets", { "search[creator_id]": localUserId }));
		const mySets = await res.json();

		this.setState({ mySets });
	}

	async initSubscribedSets() {
		const sets = App.settings.subscriptions
			.filter(tag => tag.includes("set:"))
			.map(tag => (/set:([0-9]*)/).exec(tag)[1])
			.filter(set => set && set.trim());
		const subscribedSets = [];
		
		for (const id of sets) {
			const res = await fetch(API.endpoint("post_sets/" + id));
			const set = await res.json();

			subscribedSets.push(set);
			this.setState({ subscribedSets });
		}
	}

	componentWillUnmount() {
		document.removeEventListener("scroll", this.docScrollEv);
	}

	async loadPage(to, append = true) {
		for (let page = this.page + 1; page <= to; page++) {
			this.page = page;

			const res = await fetch(API.endpoint("post_sets", { page }));
			const items = await res.json();

			const cache = this.state.items;
			cache[append ? "push" : "unshift"](...items);

			if (cache.length > 0) {
				this.lastValidPage = page;

				this.setState({ items: cache });
				document.title = `Post Sets Page ${page} | Sucralose!`;
			}
		}
	}

	render() {
		return (
			<div className="SetsPage MainPage">
				<TabsList tabs={["All Sets", "My Sets", "Subscribed Sets"]} onChange={tab => {
					if (tab === "Subscribed Sets" && !this.state.subscribedSets.length) {
						this.initSubscribedSets();
					}
				}}>
					<div tab="All Sets">
						{ this.state.items.map(set => (<Item key={set.id} {...set}/>)) }
					</div>

					<div tab="My Sets">
						{ this.state.mySets.map(set => (<Item key={set.id} {...set}/>)) }
					</div>

					<div tab="Subscribed Sets">
						{ this.state.subscribedSets.map(set => (<Item key={set.id} {...set}/>)) }
					</div>
				</TabsList>
			</div>
		);
	}
}