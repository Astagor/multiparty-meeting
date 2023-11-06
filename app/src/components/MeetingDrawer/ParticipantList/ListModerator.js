import React from 'react';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import { withRoomContext } from '../../../RoomContext';
import { useIntl, FormattedMessage } from 'react-intl';
import Button from '@material-ui/core/Button';
import { showIframeSelect } from '../../../store/selectors';
import { config } from '../../../config';

const styles = (theme) =>
	({
		root :
		{
			padding     : theme.spacing(1),
			display     : 'flex',
			flexWrap    : 'wrap',
			marginRight : -theme.spacing(1),
			marginTop   : -theme.spacing(1)
		},
		button :
		{
			marginTop   : theme.spacing(1),
			marginRight : theme.spacing(1),
			flexGrow    : '1'
		}
	});

const ListModerator = (props) =>
{
	const intl = useIntl();

	const {
		roomClient,
		room,
		iframeUrl,
		classes
	} = props;

	const isIframeShown = (iframeUrl !== '');

	const configIframeUrl = config.iframeUrls[roomClient._roomId] ? config.iframeUrls[roomClient._roomId] : '';

	return (
		<div className={classes.root}>
			<Button
				aria-label={intl.formatMessage({
					id             : 'room.muteAll',
					defaultMessage : 'Mute all'
				})}
				className={classes.button}
				variant='contained'
				color='secondary'
				disabled={room.muteAllInProgress}
				onClick={() => roomClient.muteAllPeers()}
			>
				<FormattedMessage
					id='room.muteAll'
					defaultMessage='Mute all'
				/>
			</Button>
			<Button
				aria-label={intl.formatMessage({
					id             : 'room.stopAllVideo',
					defaultMessage : 'Stop all video'
				})}
				className={classes.button}
				variant='contained'
				color='secondary'
				disabled={room.stopAllVideoInProgress}
				onClick={() => roomClient.stopAllPeerVideo()}
			>
				<FormattedMessage
					id='room.stopAllVideo'
					defaultMessage='Stop all video'
				/>
			</Button>
			<Button
				aria-label={intl.formatMessage({
					id             : 'room.stopAllScreenSharing',
					defaultMessage : 'Stop all screen sharing'
				})}
				className={classes.button}
				variant='contained'
				color='secondary'
				disabled={room.stopAllScreenSharingInProgress}
				onClick={() => roomClient.stopAllPeerScreenSharing()}
			>
				<FormattedMessage
					id='room.stopAllScreenSharing'
					defaultMessage='Stop all screen sharing'
				/>
			</Button>
			{configIframeUrl !== '' && isIframeShown &&
			<Button
				aria-label={intl.formatMessage({
					id             : 'room.hideIframe',
					defaultMessage : 'Hide whiteboard'
				})}
				className={classes.button}
				variant='contained'
				color='secondary'
				disabled={room.toggleIframeInProgress}
				onClick={() => roomClient.toggleIframe(iframeUrl)}
			>
				<FormattedMessage
					id='room.hideIframe'
					defaultMessage='Hide whiteboard'
				/>
			</Button>
			}
			{configIframeUrl !== '' && !isIframeShown &&
			<Button
				aria-label={intl.formatMessage({
					id             : 'room.showIframe',
					defaultMessage : 'Show whiteboard'
				})}
				className={classes.button}
				variant='contained'
				color='secondary'
				disabled={room.toggleIframeInProgress}
				onClick={() => roomClient.toggleIframe(iframeUrl)}
			>
				<FormattedMessage
					id='room.showIframe'
					defaultMessage='Show iFrame'
				/>
			</Button>
			}
			<Button
				aria-label={intl.formatMessage({
					id             : 'room.closeMeeting',
					defaultMessage : 'Close meeting'
				})}
				className={classes.button}
				variant='contained'
				color='secondary'
				disabled={room.closeMeetingInProgress}
				onClick={() => roomClient.closeMeeting()}
			>
				<FormattedMessage
					id='room.closeMeeting'
					defaultMessage='Close meeting'
				/>
			</Button>
		</div>
	);
};

ListModerator.propTypes =
{
	roomClient : PropTypes.any.isRequired,
	room       : PropTypes.object.isRequired,
	iframeUrl  : PropTypes.string.isRequired,
	classes    : PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
	room      : state.room,
	iframeUrl : showIframeSelect(state)
});

export default withRoomContext(connect(
	mapStateToProps,
	null,
	null,
	{
		areStatesEqual : (next, prev) =>
		{
			return (
				prev.room === next.room
			);
		}
	}
)(withStyles(styles)(ListModerator)));