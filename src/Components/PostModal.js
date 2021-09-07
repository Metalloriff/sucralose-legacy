import React from "react";
import { Query, setPageArgs, url } from "../Constants";
import { closeModal } from "./Modals";
import "./PostModal.scss";

import Spinner from "../Icons/Spinner.svg";
import Chevron from "../Icons/Chevron.svg";
import PostList from "./PostList";
import ContextMenu from "./ContextMenuHandler";
import Post, { PostContextMenu } from "./Post";
import InlineLoading from "./InlineLoading";

export class PostModalContextMenu extends React.Component {
	state = { upvotes: 0, downvotes: 0, selfScore: 0, favorited: false };

	componentDidMount() {
		if (this.props.is_favorited) {
			this.setState({ favorited: true });
		}
	}

	async vote(vote) {
		this.setState(await Post.vote(this.props.id, vote));
	}

	async favorite() {
		this.setState(await Post.favorite(this.props.id, this.state.favorited));
	}

	render() {
		return (
			<ContextMenu>
				<ContextMenu.Item className="ContextMenuItem VotesItem">
					<div className="Votes">
						<span className={this.state.selfScore > 0 ? "Voted" : null} onClick={() => this.vote(1)}>🔼 { this.state.upvotes || this.props.score.up }</span>
						<span className={this.state.selfScore < 0 ? "Voted" : null} onClick={() => this.vote(-1)}>🔽 { -(this.state.downvotes || this.props.score.down) }</span>
						<span className={this.state.favorited ? "Voted" : null} onClick={() => this.favorite()}>💙 { this.props.fav_count + (this.state.favorited ? 1 : 0) }</span>
					</div>
				</ContextMenu.Item>

				<ContextMenu.Divider/>

				<PostContextMenu {...this.props}/>
			</ContextMenu>
		)
	}
}

export default class PostModal extends React.Component {
	static current;
	state = { loaded: false, post: {} };
	close = back => {
		closeModal();
		
		if (back === true)
			Query.set("post", "");
		else return true;
	};

	componentDidMount() {
		this.setState({ post: this.props });

		Query.set("post", this.props.id);
		window.events.subscribe("popstate", this.close, { priority: 1000 });
		
		PostModal.current = this;
	}

	componentWillUnmount() {
		Query.set("post", "");
		window.events.unsubscribe("popstate", this.close);
	}

	componentDidUpdate() {
		if (!this.state.loaded) {
			if ((Object.find(this.state.post, "file.ext") || "") === "webm")
				return this.setState({ loaded: true });

			const img = new Image();
			img.addEventListener("load", () => this.setState({ loaded: true }));
			img.src = this.state.post.file.url;
		}
	}

	getOffsetPost(offset) {
		return PostList.instance.state.posts[PostList.instance.state.posts.findIndex(post => post.id === this.state.post.id) + offset];
	}

	handleClick(e) {
		if (e.target.classList.contains("NavButton")) {
			const i = e.target.classList.contains("Next") ? 1 : -1;

			if (this.getOffsetPost(i)) {
				this.setState({ post: this.getOffsetPost(i), loaded: false });
			}
		}
		else if (e.target.classList.contains("Image") || e.target.classList.contains("ContextMenuWrapper"))
			this.close(true);
	}

	render() {
		const { post } = this.state;
		const previewUrl = Object.find(post, "preview.url");
		const fileUrl = Object.find(post, "file.url");

		let el = null;

		if (post && post.file) {
			switch (post.file.ext) {
				default:
					el = (<div className="Image" style={{ backgroundImage: url(fileUrl) }}/>);
					break;
				case "webm":
					el = (
						<video controls className="Image Video">
							<source src={fileUrl} type="video/webm"/>
						</video>
					);
					break;
			}
		}

		return (
			<div className="PostModal" onClick={e => this.handleClick(e)}>
				<div className={"Image" + (this.state.loaded ? "" : " Preview")} style={{
					backgroundImage: !post || !post.file || post.file.ext === "webm" || this.state.loaded ? null : url(previewUrl)
				}}>
					{ this.state.loaded ? (
						<ContextMenu.Wrapper menu={<PostModalContextMenu {...post}/>}>
							{ el }
						</ContextMenu.Wrapper>
					) : (
						<span className="SpinnerOverlay">
							<InlineLoading/>
						</span>
					) }

					<div className="NavButtons">
						<img src={Chevron} className={"NavButton Prev" + (this.getOffsetPost(-1) === null ? " Disabled" : "")}/>
						<img src={Chevron} className={"NavButton Next" + (this.getOffsetPost(1) === null ? " Disabled" : "")}/>
					</div>
				</div>
			</div>
		);
	}
}