import React, { createRef } from "react";
import App from "../App";
import { API, formatCamelCase, Serializer } from "../Constants";
import "./Settings.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import _ from "lodash";

class List extends React.Component {
	state = { items: [], localUserId: "pending" };
	addFieldRef = createRef();

	componentDidMount() {
		this.setState({ items: this.props.items });

		// API.fetchLocalUserId().then(id => this.fetchUserSettings(id));
	}

	componentDidUpdate() {
		if (this.props.onChange) {
			this.props.onChange(this.state.items);
		}
	}

	add() {
		if (this.addFieldRef.current === null || this.addFieldRef.current.value.trim().length === 0)
			return;

		const items = [...this.state.items];

		if (this.props.split) {
			for (let s of this.addFieldRef.current.value.split(" ")) {
				if (!items.includes(s) && s) {
					items.push(s);
				}
			}
		}
		else if (!items.includes(this.addFieldRef.current.value) && this.addFieldRef.current.value)
			items.push(this.addFieldRef.current.value);
		
		this.addFieldRef.current.value = "";

		this.setState({ items });
	}

	remove(index) {
		const items = [...this.state.items];

		items.splice(index, 1);

		this.setState({ items });
	}

	render() {
		return (
			<div className="SList">
				<div className="SListTitle">
					{ this.props.title }
					{ this.props.note ? (
					<div className="SListNote">
						{ this.props.note }
					</div>
				) : null }
				</div>
				<div className="SListItems TagsList">
					{ this.state.items === null || this.state.items.length === 0 ? (
						<div className="SListPlaceholder">
							No items found.
						</div>
					) : this.state.items.map(item => (
						<div key={this.state.items.indexOf(item)} className="SListItem">
							<div className="Entry">
								{ item }
								<FontAwesomeIcon icon={faTimes} className="XButton"
												 onClick={this.remove.bind(this, this.state.items.indexOf(item))}/>
							</div>
						</div>
					)) }
				</div>
				<div className="SListControls">
					<input ref={this.addFieldRef} onKeyDown={e => { if (e.key === "Enter") this.add(); }} className="SListControl" placeholder={this.props.placeholder}/>
					<div className="SListControl" onClick={() => this.add()}>Add</div>
				</div>
			</div>
		);
	}
}


export default class Settings extends React.Component {
	static defaults = {
		colors: {
			primary: {
				type: "color",
				value: "#7bb1bd"
			},
			secondary: {
				type: "color",
				value: "#BD7BA2"
			}
		},
		backgroundColors: {
			primary: {
				type: "color",
				value: "#2c3946"
			},
			secondary: {
				type: "color",
				value: "#364758"
			},
			tertiary: {
				type: "color",
				value: "#42566a"
			}
		},
		borderRadius: {
			primary: {
				type: "slider",
				min: 0, max: 50,
				value: 4
			},
			secondary: {
				type: "slider",
				min: 0, max: 50,
				value: 7
			}
		},
		posts: {
			columnCount: {
				type: "slider",
				min: 1, max: 15,
				value: 7
			},
			mobileColumnCount: {
				type: "slider",
				min: 1, max: 7,
				value: 2
			}
		}
	};
	static props = _.merge(this.defaults, Serializer.load("settingsProps"));
	
	static save() {
		const serializable = {};
		
		// This is spaghetti and no one should ever do it, therefore I'm going to do it
		for (const cat in this.defaults) {
			for (const setting in this.defaults[cat]) {
				_.set(serializable, [cat, setting, "value"].join("."), this.props[cat][setting].value);
			}
		}
		
		const fuck = Serializer.load("settings");
		
		Serializer.save("settingsProps", serializable);
		SettingsRenderer.forceUpdate?.();
	}
	
	render() {
		return (
			<div className="SettingsPage">
				<div className="SHeader">e621 Settings</div>
				<div className="SItems">
					<div style={{ textAlign: "center", fontSize: "1.5rem", opacity: 0.5 }}>Currently unavailable.</div>
				</div>

				<div className="SHeader">Sucralose Settings</div>
				<div className="SItems">
					{ Object.keys(Settings.props).map(cat => (
						<div className="SList" key={cat}>
							<div className="SListTitle">{formatCamelCase(cat)}</div>
							
							<div className="SListItems">
								{ Object.entries(Settings.props[cat]).map(([key, setting]) =>
									<SettingField key={key} name={key} setting={setting}
												  callback={val => (Settings.props[cat][key].value = val, Settings.save())}/>) }
							</div>
						</div>
					)) }
				</div>
				
				<div className="SItems">
					<List title="Subscribed Tag Sets" items={App.settings.subscriptions} placeholder="Examples: some_artist | braeburned | rating:e score:>100"
						onChange={r => { App.settings.subscriptions = r; App.saveSettings(); }}
						note="NOTE: Due to e621 API limitations, multi-tag subscriptions will not be displayed on your home page. Example: 'rating:s score>100'"/>
					<List split title="Blacklisted Tag Sets" items={App.settings.blacklist} placeholder="Examples: intersex | score:<0 | rating:e rating:q"
						onChange={r => { App.settings.blacklist = r; App.saveSettings(); }}/>
				</div>

				<div className="SSerializers">
					<div className="Button" onClick={() => App.importSettings()}>Import Settings</div>
					<div className="Button" onClick={() => App.exportSettings()}>Export Settings</div>
				</div>
			</div>
		);
	}
}

export function SettingField({ name, setting, callback }) {
	const [value, setValueState] = React.useState(setting.value);
	const setState = newVal => (callback?.(newVal), setValueState(newVal));

	switch (setting.type) {
		default: return null;

		case "color": return (
			<div className="SListItem">
				<div className="EntryTitle">{formatCamelCase(name)}</div>

				<span className="ColorPreview" style={{ backgroundColor: value }}/>
				<input className="Entry ColorField" defaultValue={value}
					   onInput={e => setState(e.currentTarget.value)}/>
			</div>
		);
		
		case "slider": return (
			<div className="SListItem">
				<div className="EntryTitle">{formatCamelCase(name)} - {value}</div>
				
				<input className="Entry SliderField" defaultValue={value}
					   type="range"
					   onInput={e => setState(e.currentTarget.value)}
					   min={setting.min} max={setting.max}/>
			</div>
		);
	}
}

export function SettingsRenderer() {
	const [, forceUpdate] = React.useReducer(x => x + 1, 0);
	SettingsRenderer.forceUpdate = forceUpdate;
	
	const { props } = Settings;
	
	return (
		<style>
		{`
			:root {
				--primary-color: ${props.colors.primary.value};
				--secondary-color: ${props.colors.secondary.value};
				
				--primary-bg: ${props.backgroundColors.primary.value};
				--secondary-bg: ${props.backgroundColors.secondary.value};
				--tertiary-bg: ${props.backgroundColors.tertiary.value};
				
				--primary-border-radius: ${props.borderRadius.primary.value}px;
				--secondary-border-radius: ${props.borderRadius.secondary.value}px;
				
				--post-column-count: ${props.posts.columnCount.value};
				--mobile-post-column-count: ${props.posts.mobileColumnCount.value};
			}
		`}
		</style>
	);
}