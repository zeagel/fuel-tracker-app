// Clear all earlier timeouts in order to avoid waterfall of
// stacked notification timeouts. Code for this was borrowed
// from StackOverFlow, see: https://tinyurl.com/y5hhzs2h.
export const clearAllEarlierTimeouts = () => {
  const highestId = window.setTimeout(() => {
    for (let i = highestId; i >= 0; i--) {
      window.clearInterval(i);
    }
  }, 0);
};


const notificationReducer = (state = null, action) => {
  switch(action.type) {
    case 'SET_NOTIFICATION':
      return action.data.notification;
    case 'CLEAR_NOTIFICATION':
      return null;
    default:
      return state;
  }
};

export const setNotification = (messageObject) => {
  return async dispatch => {
    clearAllEarlierTimeouts();

    setTimeout(() => {
      dispatch(clearNotification());
    }, messageObject.timeout*1000);

    dispatch({
      type: 'SET_NOTIFICATION',
      data: { notification: messageObject }
    });
  };
};

export const clearNotification = () => {
  return async dispatch => {
    clearAllEarlierTimeouts();

    dispatch({
      type: 'CLEAR_NOTIFICATION',
      data: null
    });
  };
};

export default notificationReducer;