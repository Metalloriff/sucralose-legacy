import React from "react";
import { API, url } from "../Constants";
import LinkWrapper from "./LinkWrapper";
import "./PostCommentList.scss";

export default class extends React.Component {
	interval;
	state = { comments: [] };

	componentDidMount() {
		this.interval = setInterval(() => this.refresh(), 10000);
		this.refresh();
	}

	async refresh() {
		const res = await fetch(API.endpoint("posts/" + this.props.post.id + "/comments"));
		const data = await res.json();
		const doc = new DOMParser().parseFromString(data.html, "text/html");
		const comments = [];

		for (let com of doc.getElementsByClassName("comment")) {
			const avatar = com.getElementsByClassName("avatar")[0].children[0];

			comments.push({
				id: com.attributes["data-comment-id"].nodeValue,
				user: com.attributes["data-creator-id"].nodeValue,
				username: (com.getElementsByClassName("user-member")[0] || { innerText: "Unknown User" }).innerText.trim(),
				body: com.getElementsByClassName("body styled-dtext")[0].innerHTML.trim(),
				avatar: data.posts[avatar === null ? null : avatar.attributes["data-id"].nodeValue],
				timestamp: com.getElementsByTagName("time")[0].innerText
			});
		}

		this.setState({ comments });
	}

	componentWillUnmount() {
		clearInterval(this.interval);
	}

	render() {
		return (
			<div className="Comments">
				{ this.state.comments.map(comment => (
					<div className="Comment" key={comment.id}>
						{ comment.avatar === null || comment.avatar.preview_url === null ? (<div className="Avatar Placeholder"/>) : (
							<LinkWrapper href={"#/post/" + comment.avatar.id}>
								<div className="Avatar" style={{
									backgroundImage: url(comment.avatar.preview_url)
								}}/>
							</LinkWrapper>
						) }

						<div className="Inner">
							<LinkWrapper href={"#/user/" + comment.user}>
								<span className="Username">
									{ comment.username }
								</span>
							</LinkWrapper>
							<span className="Timestamp">
								{ comment.timestamp }
							</span>

							<div className="Content" dangerouslySetInnerHTML={{ __html: comment.body }}/>
						</div>
					</div>
				)) }
			</div>
		);
	}
}