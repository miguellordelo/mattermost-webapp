// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {FormattedMessage} from 'react-intl';

import Constants from 'utils/constants.jsx';
import * as Utils from 'utils/utils.jsx';

import FormattedMarkdownMessage from 'components/formatted_markdown_message.jsx';

import AdminSettings from './admin_settings.jsx';
import DropdownSetting from './dropdown_setting.jsx';
import SettingsGroup from './settings_group.jsx';
import TextSetting from './text_setting.jsx';

const PUSH_NOTIFICATIONS_OFF = 'off';
const PUSH_NOTIFICATIONS_MHPNS = 'mhpns';
const PUSH_NOTIFICATIONS_MTPNS = 'mtpns';
const PUSH_NOTIFICATIONS_CUSTOM = 'custom';

export default class PushSettings extends AdminSettings {
    constructor(props) {
        super(props);

        this.canSave = this.canSave.bind(this);
        this.handleAgreeChange = this.handleAgreeChange.bind(this);
        this.getConfigFromState = this.getConfigFromState.bind(this);
        this.renderSettings = this.renderSettings.bind(this);
        this.handleDropdownChange = this.handleDropdownChange.bind(this);
    }

    canSave() {
        return this.state.pushNotificationServerType !== PUSH_NOTIFICATIONS_MHPNS || this.state.agree;
    }

    handleAgreeChange(e) {
        this.setState({
            agree: e.target.checked,
        });
    }

    handleDropdownChange(id, value) {
        if (id === 'pushNotificationServerType') {
            this.setState({
                agree: false,
            });

            if (value === PUSH_NOTIFICATIONS_MHPNS) {
                this.setState({
                    pushNotificationServer: Constants.MHPNS,
                });
            } else if (value === PUSH_NOTIFICATIONS_MTPNS) {
                this.setState({
                    pushNotificationServer: Constants.MTPNS,
                });
            } else if (value === PUSH_NOTIFICATIONS_CUSTOM &&
                (this.state.pushNotificationServerType === PUSH_NOTIFICATIONS_MTPNS ||
                this.state.pushNotificationServerType === PUSH_NOTIFICATIONS_MHPNS)) {
                this.setState({
                    pushNotificationServer: '',
                });
            }
        }

        this.handleChange(id, value);
    }

    getConfigFromState(config) {
        config.EmailSettings.SendPushNotifications = this.state.pushNotificationServerType !== PUSH_NOTIFICATIONS_OFF;
        config.EmailSettings.PushNotificationServer = this.state.pushNotificationServer.trim();
        config.EmailSettings.PushNotificationContents = this.state.pushNotificationContents;

        return config;
    }

    getStateFromConfig(config) {
        let pushNotificationServerType = PUSH_NOTIFICATIONS_CUSTOM;
        let agree = false;
        if (!config.EmailSettings.SendPushNotifications) {
            pushNotificationServerType = PUSH_NOTIFICATIONS_OFF;
        } else if (config.EmailSettings.PushNotificationServer === Constants.MHPNS &&
            this.props.license.IsLicensed === 'true' && this.props.license.MHPNS === 'true') {
            pushNotificationServerType = PUSH_NOTIFICATIONS_MHPNS;
            agree = true;
        } else if (config.EmailSettings.PushNotificationServer === Constants.MTPNS) {
            pushNotificationServerType = PUSH_NOTIFICATIONS_MTPNS;
        }

        let pushNotificationServer = config.EmailSettings.PushNotificationServer;
        if (pushNotificationServerType === PUSH_NOTIFICATIONS_MTPNS) {
            pushNotificationServer = Constants.MTPNS;
        } else if (pushNotificationServerType === PUSH_NOTIFICATIONS_MHPNS) {
            pushNotificationServer = Constants.MHPNS;
        }

        return {
            pushNotificationServerType,
            pushNotificationServer,
            pushNotificationContents: config.EmailSettings.PushNotificationContents,
            agree,
        };
    }

    isPushNotificationServerSetByEnv = () => {
        // Assume that if one of these has been set using an environment variable,
        // all of them have been set that way
        return this.isSetByEnv('EmailSettings.SendPushNotifications') ||
            this.isSetByEnv('EmailSettings.PushNotificationServer');
    };

    renderTitle() {
        return (
            <FormattedMessage
                id='admin.environment.pushNotifications'
                defaultMessage='Push Notifications'
            />
        );
    }

    renderSettings() {
        const pushNotificationServerTypes = [];
        pushNotificationServerTypes.push({value: PUSH_NOTIFICATIONS_OFF, text: Utils.localizeMessage('admin.email.pushOff', 'Do not send push notifications')});
        if (this.props.license.IsLicensed === 'true' && this.props.license.MHPNS === 'true') {
            pushNotificationServerTypes.push({value: PUSH_NOTIFICATIONS_MHPNS, text: Utils.localizeMessage('admin.email.mhpns', 'Use HPNS connection with uptime SLA to send notifications to iOS and Android apps')});
        }
        pushNotificationServerTypes.push({value: PUSH_NOTIFICATIONS_MTPNS, text: Utils.localizeMessage('admin.email.mtpns', 'Use TPNS connection to send notifications to iOS and Android apps')});
        pushNotificationServerTypes.push({value: PUSH_NOTIFICATIONS_CUSTOM, text: Utils.localizeMessage('admin.email.selfPush', 'Manually enter Push Notification Service location')});

        let sendHelpText = null;
        let pushServerHelpText = null;
        if (this.state.pushNotificationServerType === PUSH_NOTIFICATIONS_OFF) {
            sendHelpText = (
                <FormattedMarkdownMessage
                    id='admin.email.pushOffHelp'
                    defaultMessage='Please see [documentation on push notifications](!https://about.mattermost.com/default-mobile-push-notifications/) to learn more about setup options.'
                />
            );
        } else if (this.state.pushNotificationServerType === PUSH_NOTIFICATIONS_MHPNS) {
            pushServerHelpText = (
                <FormattedMarkdownMessage
                    id='admin.email.mhpnsHelp'
                    defaultMessage='Download [Mattermost iOS app](!https://about.mattermost.com/mattermost-ios-app/) from iTunes. Download [Mattermost Android app](!https://about.mattermost.com/mattermost-android-app/) from Google Play. Learn more about the [Mattermost Hosted Push Notification Service](!https://about.mattermost.com/default-hpns/).'
                />
            );
        } else if (this.state.pushNotificationServerType === PUSH_NOTIFICATIONS_MTPNS) {
            pushServerHelpText = (
                <FormattedMarkdownMessage
                    id='admin.email.mtpnsHelp'
                    defaultMessage='Download [Mattermost iOS app](!https://about.mattermost.com/mattermost-ios-app/) from iTunes. Download [Mattermost Android app](!https://about.mattermost.com/mattermost-android-app/) from Google Play. Learn more about the [Mattermost Test Push Notification Service](!https://about.mattermost.com/default-tpns/).'
                />
            );
        } else {
            pushServerHelpText = (
                <FormattedMarkdownMessage
                    id='admin.email.easHelp'
                    defaultMessage='Learn more about compiling and deploying your own mobile apps from an [Enterprise App Store](!https://about.mattermost.com/default-enterprise-app-store).'
                />
            );
        }

        let tosCheckbox;
        if (this.state.pushNotificationServerType === PUSH_NOTIFICATIONS_MHPNS) {
            tosCheckbox = (
                <div className='form-group'>
                    <div className='col-sm-4'/>
                    <div className='col-sm-8'>
                        <input
                            type='checkbox'
                            ref='agree'
                            checked={this.state.agree}
                            onChange={this.handleAgreeChange}
                        />
                        <FormattedMarkdownMessage
                            id='admin.email.agreeHPNS'
                            defaultMessage=' I understand and accept the Mattermost Hosted Push Notification Service [Terms of Service](!https://about.mattermost.com/hpns-terms/) and [Privacy Policy](!https://about.mattermost.com/hpns-privacy/).'
                        />
                    </div>
                </div>
            );
        }

        return (
            <SettingsGroup>
                <DropdownSetting
                    id='pushNotificationServerType'
                    values={pushNotificationServerTypes}
                    label={
                        <FormattedMessage
                            id='admin.email.pushTitle'
                            defaultMessage='Enable Push Notifications: '
                        />
                    }
                    value={this.state.pushNotificationServerType}
                    onChange={this.handleDropdownChange}
                    helpText={sendHelpText}
                    setByEnv={this.isPushNotificationServerSetByEnv()}
                />
                {tosCheckbox}
                <TextSetting
                    id='pushNotificationServer'
                    label={
                        <FormattedMessage
                            id='admin.email.pushServerTitle'
                            defaultMessage='Push Notification Server:'
                        />
                    }
                    placeholder={Utils.localizeMessage('admin.email.pushServerEx', 'E.g.: "https://push-test.mattermost.com"')}
                    helpText={pushServerHelpText}
                    value={this.state.pushNotificationServer}
                    onChange={this.handleChange}
                    disabled={this.state.pushNotificationServerType !== PUSH_NOTIFICATIONS_CUSTOM}
                    setByEnv={this.isSetByEnv('EmailSettings.PushNotificationServer')}
                />
                <DropdownSetting
                    id='pushNotificationContents'
                    values={[
                        {value: 'generic_no_channel', text: Utils.localizeMessage('admin.email.genericNoChannelPushNotification', '"Send generic description with only sender name')},
                        {value: 'generic', text: Utils.localizeMessage('admin.email.genericPushNotification', 'Send generic description with sender and channel names')},
                        {value: 'full', text: Utils.localizeMessage('admin.email.fullPushNotification', 'Send full message snippet')},
                    ]}
                    label={
                        <FormattedMessage
                            id='admin.email.pushContentTitle'
                            defaultMessage='Push Notification Contents:'
                        />
                    }
                    value={this.state.pushNotificationContents}
                    onChange={this.handleDropdownChange}
                    disabled={this.state.pushNotificationServerType === PUSH_NOTIFICATIONS_OFF}
                    helpText={
                        <FormattedMarkdownMessage
                            id='admin.email.pushContentDesc'
                            defaultMessage='"Send generic description with only sender name" includes only the name of the person who sent the message in push notifications, with no information about channel name or message contents.\n \n"Send generic description with sender and channel names" includes the name of the person who sent the message and the channel it was sent in, but not the message text.\n \n"Send full message snippet" includes a message excerpt in push notifications, which may contain confidential information sent in messages. If your Push Notification Service is outside your firewall, it is *highly recommended* this option only be used with an "https" protocol to encrypt the connection.'
                        />
                    }
                    setByEnv={this.isSetByEnv('EmailSettings.PushNotificationContents')}
                />
            </SettingsGroup>
        );
    }
}
