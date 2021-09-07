import React from "react";
import TabsList from "../Components/TabsList";
import PostTagsList from "../Components/PostTagsList";
import { API, bytesToString, download, getPageArgs, url } from "../Constants";
import "./Post.scss";
import PostCommentList from "../Components/PostCommentList";
import ContextMenu from "../Components/ContextMenuHandler";
import Post, { PostContextMenu } from "../Components/Post";

/* Todo
	Handle null post.
*/

class InfoItem extends React.Component {
	render() {
		return (
			<div className="InfoItem">
				<span className="ILabel">{ this.props.label }</span>
				{ this.props.content === null ? null : (<span className="IContent">{ this.props.content }</span>) }

				{ this.props.children }
			</div>
		);
	}
}

export default class extends React.Component {
	id;
	state = { post: null, ready: false, selfScore: 0 };

	async componentDidMount() {
		const id = this.id = getPageArgs("post");

		document.title = `#${id} | Sucralose!`;

		try {
			const res = await fetch(API.endpoint("posts/" + id));
			const post = (await res.json()).post;

			if (post)
				this.setState({ post, ready: true });
			else
				this.setState({ ready: false });
		} catch (err) {
			console.error(err);
			this.setState({ ready: true });
		}
	}

	componentDidUpdate() {
		if (this.id !== getPageArgs("post")) {
			this.componentDidMount();

			this.id = getPageArgs("post");
		}
	}

	formatSource(source) {
		return source.split(/(http|https):\/\//)[2].replace("www.", "").split(".")[0];
	}

	async vote(vote) {
		this.setState({ selfScore: (await Post.vote(this.state.post.id, vote)).selfScore });
	}

	async favorite() {
		this.state.post.is_favorited = await Post.favorite(this.state.post.id, this.state.post.is_favorited);

		this.forceUpdate();
	}

	render() {
		const { post } = this.state;

		const commentLabel = post === null ? "Comments" : `Comments (${post.comment_count})`;

		let contentView;

		if (post && post.file) {
			switch (post.file.ext) {
				case "webm":
					contentView = (
						<video controls className="Image Video">
							<source src={post.file.url} type="video/webm"/>
						</video>
					);
					break;
				default:
					contentView = (<div className="Image" style={{ backgroundImage: url(post.file.url) }}/>);
					break;
			}
		}

		return (
			<div className="PostPage">
				{ this.state.ready && post && post.file && post.file.url ? (
					<div>
						<ContextMenu.Wrapper menu={<PostContextMenu {...post}/>}>
							{ contentView }
						</ContextMenu.Wrapper>

						<div className="PostButtonList">
							<div className="Button" onClick={() => download(post.file.url)}>Download</div>
							<div className="Votes">
								<div className={"Button" + (this.state.selfScore > 0 ? " Voted" : "")} onClick={() => this.vote(1)}>🔼 Upvote ({ post.score.up })</div>
								<div className={"Button" + (this.state.selfScore < 0 ? " Voted" : "")} onClick={() => this.vote(-1)}>🔽 Downvote ({ -post.score.down })</div>
								<div className={"Button" + (post.is_favorited ? " Voted" : "")} onClick={() => this.favorite()}>💙 Favorite ({ post.fav_count })</div>
							</div>
						</div>

						{ post.description && post.description.trim().length > 0 ? (
							<div className="DescriptionContainer">
								<div className="Description" dangerouslySetInnerHTML={{
									__html: post.description
										.replace(/http(\S*)/gmi, link => `<a href="${link}">${link}</a>`)
										.split("\n").join("<br/>")
								}}/>
							</div>
						) : null }

						<TabsList tabs={["Tags", commentLabel, "Info"]}>
							<PostTagsList tab="Tags" tags={post.tags}/>
							<PostCommentList tab={commentLabel} post={post}/>
							<div tab="Info" className="InfoTab">
								<InfoItem label="Post ID: " content={"#" + post.id}/>
								<InfoItem label="Post MD5: " content={post.file.md5}/>
								<InfoItem label="Created at: " content={new Date(post.created_at).toLocaleDateString() + ", " + new Date(post.created_at).toLocaleTimeString()}/>
								<InfoItem label="Size: " content={bytesToString(post.file.size)}/>
								<InfoItem label="Width: " content={post.file.width + " pixels"}/>
								<InfoItem label="Height: " content={post.file.height + " pixels"}/>
								<InfoItem label="File extension: " content={post.file.ext.toUpperCase()}/>
								<InfoItem label="Flags: " content={
									Object.values(post.flags).filter(f => f).length > 0
										? Object.keys(post.flags).filter(f => post.flags[f]).join(", ")
										: "none" }/>
								<InfoItem label="Rating: " content={post.rating === "e" ? "explicit" : post.rating === "q" ? "questionable" : "safe"}/>
								<InfoItem label="Sources: ">{ 
									<div style={{ display: "flex", flexDirection: "column" }}>
										{ post.sources.map(source =>
											(<a key={source} href={source} style={{ textTransform: "capitalize" }}>{ this.formatSource(source) }</a>)) }
									</div> }</InfoItem>
								<InfoItem label="Uploader: "> <a href={"#/user/" + post.uploader_id}>{ post.uploader_id }</a> </InfoItem>
							</div>
						</TabsList>
					</div>
				) : null }
			</div>
		)
	}
}