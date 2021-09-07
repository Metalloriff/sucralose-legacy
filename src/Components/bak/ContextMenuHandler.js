import React, { createRef } from "react";
import "./ContextMenuHandler.scss";

import ChevronIcon from "../Icons/Chevron.svg";

/* Todo
	Prevent context menus from clipping off of the screen.
*/

class ContextMenu extends React.Component {
	ref = createRef();

	docClickEv = e => {
		if (this.ref.current && !this.ref.current.contains(e.target) && !document.getElementsByClassName("ContextMenu")[0].contains(e.target)) {
			this.close();
		}
	}

	close() {
		if (ContextMenu.activeWrapper) {
			ContextMenu.activeWrapper.setState({ menu: null, open: false });
		}
	}

	componentDidMount() {
		document.addEventListener("click", this.docClickEv);
	}

	componentWillUnmount() {
		document.removeEventListener("click", this.docClickEv);
	}

	render() {
		return (
			<div className="ContextMenu" {...this.props} ref={this.ref}>
				{ this.props.children }
			</div>
		);
	}
}

ContextMenu.Wrapper = class extends React.Component {
	state = { menu: null, open: false };
	ref = createRef();

	handleContextMenu(e) {
		e.preventDefault();

		if (ContextMenu.activeWrapper) {
			if (this.ref.current.contains(ContextMenu.activeWrapper.ref.current) && ContextMenu.activeWrapper.props.menu !== this.props.menu)
				return;
			ContextMenu.activeWrapper.setState({ menu: null, open: false });
		}

		ContextMenu.activeWrapper = this;

		this.setState({ menu: (
			<div className="ContextMenuContainer" {...this.props} style={{
				position: "fixed",
				top: e.clientY,
				left: e.clientX
			}}>{ this.props.menu }</div>
		), open: true });
	}

	componentDidUpdate() {
		if (ContextMenu.activeWrapper === this && !this.state.open) {
			ContextMenu.activeWrapper = null;
		}
	}

	render() {
		return (
			<div ref={this.ref} className="ContextMenuWrapper" {...this.props} onContextMenu={e => this.handleContextMenu(e)}>
				{ this.props.children }
				{ this.state.open ? this.state.menu : null }
			</div>
		)
	}
}

ContextMenu.Item = class extends React.Component {
	handleClick = () => {
		if (ContextMenu.activeWrapper && this.props.autoClose) {
			ContextMenu.activeWrapper.setState({ menu: null, open: false });
		}

		if (this.props.onClick) {
			this.props.onClick(this);
		}
	}

	render() {
		const props = Object.assign({}, this.props);

		delete props.autoClose;

		return (
			<div className="ContextMenuItem" {...props} onClick={this.handleClick}>
				{ this.props.children }
			</div>
		)
	}
}

ContextMenu.SubMenuItem = class extends React.Component {
	state = { open: false };

	handleMouseEnter = () => {
		this.setState({ open: true });
	}

	handleMouseLeave = () => {
		this.setState({ open: false });
	}

	handleClick = e => {
		if (e.target !== e.currentTarget) {
			return;
		}

		if (ContextMenu.activeWrapper && this.props.autoClose) {
			ContextMenu.activeWrapper.setState({ menu: null, open: false });
		}

		if (this.props.onClick) {
			this.props.onClick(this);
		}
	}

	render() {
		const props = Object.assign({}, this.props);

		delete props.autoClose;
		delete props.label;

		return (
			<div className="ContextMenuItem HasSubMenu" {...props} onClick={this.handleClick} onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
				{ this.props.label } <img className="ContextSubMenuChevron" src={ChevronIcon}/>
				{ this.state.open ? (
					<div className="ContextMenuContainer SubMenuContainer" onLoad={console.log}>
						<div className="ContextMenu SubMenu">
							{ this.props.children }
						</div>
					</div>
				) : null }
			</div>
		)
	}
}

ContextMenu.ToggleItem = class extends React.Component {
	state = { checked: false };

	callback = () => {
		if (ContextMenu.activeWrapper && this.props.autoClose) {
			ContextMenu.activeWrapper.setState({ menu: null, open: false });
		}

		if (this.props.callback) {
			this.props.callback(this);
		}
	}

	componentDidMount() {
		this.setState({ checked: this.props.checked });
	}

	render() {
		const props = Object.assign({}, this.props);

		delete props.autoClose;
		delete props.callback;

		return (
			<div className="ContextMenuItem ToggleItem" {...props} onClick={this.callback}>
				{ this.props.children }
				<div className={"ToggleBox" + (this.state.checked ? " Checked" : "")}>
					{ this.state.checked ? (<div className="ToggleBoxTick"/>) : null }
				</div>
			</div>
		)
	}
}

ContextMenu.Divider = class extends React.Component {
	render() {
		return (
			<div className="ContextMenuDivider" {...this.props}/>
		)
	}
}

export default ContextMenu;