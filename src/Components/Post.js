import React from "react";
import ContextMenu from "./ContextMenuHandler";
import App from "../App";
import { API, download, url } from "../Constants";
import { copyToClipboard, openModal } from "./Modals";
import "./Post.scss";
import PostModal from "./PostModal";
import { PostTagContextMenu } from "./PostTagsList";
import Toasts, { Toast } from "./Toasts";
import LinkWrapper from "./LinkWrapper";
import {
	faCaretSquareDown,
	faCaretSquareUp,
	faClipboard, faCog,
	faDownload,
	faExternalLinkAlt, faHeart,
	faImage,
	faLayerGroup,
	faPlus
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import InlineLoading from "./InlineLoading";

/* Todo
	Figure out how to fix the preflight request on favorites.json DELETE method.
	Handle flash files.
*/

export class PostContextMenu extends React.Component {
	async handleSet(set, toggle) {
		const res = await fetch(API.endpoint("post_sets/" + set.id + (set.post_ids.includes(this.props.id) ? "/remove_posts" : "/add_posts"),
			{ "post_ids[]": this.props.id }), { method: "POST" });
		App.postSets[App.postSets.findIndex(s => s.id === set.id)] = await res.json();
		
		// toggle.setState({ checked: !set.post_ids.includes(this.props.id) });
		this.forceUpdate();
	}

	render() {
		return (
			<ContextMenu>
				<ContextMenu.Item autoClose onClick={() => window.open(this.props.file.url, "_blank")} icon={faImage}>View Image</ContextMenu.Item>
				<ContextMenu.Item autoClose onClick={() => download(this.props.file.url)} icon={faDownload}>Save Image</ContextMenu.Item>
				<ContextMenu.Item autoClose onClick={() => copyToClipboard(this.props.file.url)} icon={faClipboard}>Copy Image URL</ContextMenu.Item>

				<ContextMenu.Divider/>

				<ContextMenu.Item autoClose onClick={() => window.open("#/post/" + this.props.id)} icon={faExternalLinkAlt}>Open In New Tab</ContextMenu.Item>

				{ App.loggedIn() && App.postSets ? (
					<div>
						<ContextMenu.Divider/>

						<ContextMenu.SubMenuItem label="Manage Sets" icon={faLayerGroup}>
							{ App.postSets.map(set => (
								<ContextMenu.Item key={set.id} onClick={() => this.handleSet(set)}
									className={"ContextMenuItem SetContextMenuItem" + (set.post_ids.includes(this.props.id) ? " Added" : "")}>
									<span>{set.name}</span>
								</ContextMenu.Item>
							)) }

							<ContextMenu.Divider/>

							<ContextMenu.Item autoClose onClick={() => window.location.assign("#/sets/create")} icon={faPlus}>Create Set</ContextMenu.Item>
							<ContextMenu.Item autoClose onClick={() => window.location.assign("#/sets/manage")} icon={faCog}>Manage All</ContextMenu.Item>
						</ContextMenu.SubMenuItem>
					</div>
				) : null }
			</ContextMenu>
		);
	}
}

export default class Post extends React.Component {
	state = { upvotes: 0, downvotes: 0, selfScore: 0, favorited: false, loading: true };

	componentDidMount() {
		this.setState({ favorited: this.props.is_favorited });
	}

	async vote(vote) {
		this.setState(await Post.vote(this.props.id, vote));
	}

	async favorite() {
		this.setState(await Post.favorite(this.props.id, this.state.favorited));
	}

	render() {
		const { sample, tags, id, fav_count, score } = this.props;
		const { loading } = this.state;
		
		return (
			<div>
				<ContextMenu.Wrapper menu={<PostContextMenu {...this.props}/>}>
					<div className="Post">
						<img className="Preview" src={sample.url}
							 onClick={openModal.bind(null, <PostModal {...this.props}/>)} alt=""
							 onLoad={() => this.setState({ loading: false })}/>
						{ loading ? <InlineLoading/> : null }

						<div className="Details PostHeader">
							<span><b>Artist{tags.artist.length > 1 ? "s" : ""}:</b> { tags.artist.map(a => (
								<span key={a}>
									<ContextMenu.Wrapper menu={<PostTagContextMenu tag={a}/>}>
										<span className="Link" onClick={() => window.search(a)}>{ a }</span>
									</ContextMenu.Wrapper>
									{ tags.artist.indexOf(a) + 1 === tags.artist.length ? null : (<span>, </span>) }
								</span>)
							) }</span>
						</div>

						<div className="Details PostFooter">
							<span className={this.state.selfScore > 0 ? "Voted" : null} onClick={() => this.vote(1)}>
								<FontAwesomeIcon icon={faCaretSquareUp} className="Icon"/> { this.state.upvotes || score.up }</span>
							<span className={this.state.selfScore < 0 ? "Voted" : null} onClick={() => this.vote(-1)}>
								<FontAwesomeIcon icon={faCaretSquareDown} className="Icon"/> { -(this.state.downvotes || score.down) }</span>
							<span className={this.state.favorited ? "Voted" : null} onClick={() => this.favorite()}>
								<FontAwesomeIcon icon={faHeart}/> { fav_count + (this.state.favorited ? 1 : 0) }</span>
							<LinkWrapper href={"#/post/" + id}>
								<FontAwesomeIcon icon={faExternalLinkAlt}/>
							</LinkWrapper>
						</div>
					</div>
				</ContextMenu.Wrapper>
			</div>
		);
	}
}

Post.voting = {};
Post.favoriting = {};

Post.vote = async function(post_id, vote) {
	if (!App.loggedIn())
		return App.promptLogin("You must be logged in to vote on posts!");

	if (!Post.voting[post_id]) {
		Post.voting[post_id] = true;

		const res = await fetch(API.endpoint("posts/" + post_id + "/votes", { score: vote, no_unvote: false }), { method: "POST" });
		const data = await res.json();
		
		delete Post.voting[post_id];

		Toasts.showToast(`${data.our_score === 0 ? "Removed" : "Added"} ${vote === 1 ? "up-vote" : "down-vote"} post #${post_id}`);

		return { upvotes: data.up, downvotes: data.down, selfScore: data.our_score };
	}
	else
		Toasts.showToast("You're attempting to vote on this post too quickly!", "Failure");
}

Post.favorite = async function(post_id, favorited) {
	if (!App.loggedIn())
		return App.promptLogin("You must be logged in to favorite on posts!");

	if (!Post.favoriting[post_id]) {
		Post.favoriting[post_id] = true;
		
		if (favorited)
			return openModal(
				<div className="ClipboardModal" style={{ minHeight: "22%" }}>
					<span>
						Due to an issue with e621's API, you are currently unable to unfavorite posts from this website.
						<br/>
						Alternatively, you can click <a href={"https://e621.net/posts/" + post_id}>this link</a> to unfavorite it on the vanilla site.
						<br/><br/>
						I apologize for the incovenience, this issue will be fixed in a later update.
					</span>
				</div>
			);
			// await fetch(API.endpoint("favorites/" + post_id), { method: "DELETE" });
		else
			await fetch(API.endpoint("favorites", { post_id }), { method: "POST" });

		Toasts.showToast("Favorited post #" + post_id);

		delete Post.favoriting[post_id];
		return { favorited: !favorited };
	}
	else
		Toasts.showToast("Failed to favorite! Please try again.", "Failure");
}