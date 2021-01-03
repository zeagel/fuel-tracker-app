import React from 'react';
import { useSelector } from 'react-redux';
import { Message } from 'semantic-ui-react';
import './Notification.css';

const Notification = () => {
  const note = useSelector(state => state.note);

  return (
    <Message color={note.type === 'info' ? 'green' : 'red' }>
      {note.header ? <div className='note-header'>{note.header}</div> : null}
      <div>{note.content}</div>
    </Message>
  );
};

export default Notification;