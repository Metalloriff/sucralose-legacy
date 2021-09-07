import React from "react";
import Post from "../Components/Post";
import PostList from "../Components/PostList";
import TabsList from "../Components/TabsList";
import { API, getPageArgs } from "../Constants";
import "./User.scss";

import Spinner from "../Icons/Spinner.svg";

export default class extends React.Component {
	state = { name: "", avatar: null, favCount: 0, postCount: 0, about: null };

	async componentDidMount() {
		const res = await fetch(API.endpoint("users/" + getPageArgs("user"), {}, true));
		const doc = new DOMParser().parseFromString(await res.text(), "text/html");

		const name = doc.getElementsByClassName("user-member")[0].textContent;
		const avatar = await this.parseAvatar(doc.getElementsByClassName("profile-avatar")[0]);
		const favCount = [...doc.getElementsByTagName("a")].find(e => e.href.includes("/favorites")).textContent;
		const postCount = [...doc.getElementsByClassName("user-statistics")[0].getElementsByTagName("a")].find(e => e.href.includes("/posts")).textContent;
		const about = this.parseAboutInfo(doc.getElementsByClassName("about-section")[0]);

		this.setState({ name, avatar, favCount, postCount, about });
	}

	async parseAvatar(avatar) {
		if (!avatar || !avatar.firstElementChild)
			return null;
			
		try {
			const res = await fetch(API.endpoint("posts/" + avatar.firstElementChild.dataset.id));
			return await res.json();
		}
		catch (err) {
			console.error(err);
			return null;
		}
	}

	parseAboutInfo(section) {
		if (!section)
			return;
			
		const [ content ] = section.getElementsByClassName("content");
		if (content && content.firstElementChild)
			return content.firstElementChild.textContent;
	}

	render() {
		const { name, avatar, favCount, postCount, about } = this.state;

		const favorites = `Favorites (${favCount})`;
		const posts = `Posts (${postCount})`;

		return (
			<div className="UserPage">
				<div className="Head">
					<div className="AvatarContainer">
						{ avatar && avatar.post ? (<Post {...avatar.post}/>) : null }
					</div>

					<div>
						<div className="Username">{ name }</div>
						<div className="About">{ about || "" }</div>
					</div>
				</div>

				<TabsList tabs={["Info", favorites, posts]}>
					<PostList tab={favorites} endpoint="favorites" endpointArgs={{ user_id: getPageArgs("user") }}/>
					<PostList tab={posts} tags={ "user:" + name.replace(/ /g, "_") }/>
				</TabsList>

				{ !name ? (
					<div className="PostListFetchingOverlay">
						<img src={Spinner} className="Spinner"/>
					</div>
				) : null }
			</div>
		);
	}
};