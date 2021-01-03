import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Button,
  Form,
  Grid,
  Header,
  Image,
  Message,
  Segment,
  Icon
} from 'semantic-ui-react';
import { loginUser } from '../reducers/loginReducer';
import Notification from '../components/Notification/Notification';
import { clearNotification } from '../reducers/notificationReducer';
const loginPageLogo = require('../assets/images/logo-gasoline-pump.png');

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const note = useSelector(state => state.note);

  const dispatch = useDispatch();

  const handleUserNameOnChange = (event) => {
    setUsername(event.target.value);
  };

  const handleUserPasswordOnChange = (event) => {
    setPassword(event.target.value);
  };

  const handleSubmitLogin = async (event) => {
    event.preventDefault();
    dispatch(loginUser({ user: { username, password } }));
  };

  return (
    <Grid textAlign='center' style={{ height: '65vh' }} verticalAlign='middle'>
      <Grid.Column style={{ maxWidth: 450 }}>
        <Header as='h2' color='orange' textAlign='center'>
          <Image src={loginPageLogo} /> Tankkitutka
        </Header>
        <Form size='large' onSubmit={handleSubmitLogin}>
          <Segment raised>
            <Form.Input
              id='username'
              fluid
              icon='user'
              iconPosition='left'
              placeholder='Käyttäjätunnus'
              onChange={handleUserNameOnChange}
            />
            <Form.Input
              id='password'
              fluid
              icon='lock'
              iconPosition='left'
              placeholder='Salasana'
              type='password'
              onChange={handleUserPasswordOnChange}
            />

            <Button type='submit' color='orange' fluid size='large'>
              Kirjaudu
            </Button>
          </Segment>
        </Form>
        <Message>
          Ei tunnusta vielä?
          <Link
            to="/register"
            onClick={() => dispatch(clearNotification())}
          > Rekisteröidy
          </Link>
        </Message>
        <Message icon color='yellow'>
          <Icon name='warning sign' />
          <Message.Content style={{ textAlign: 'left' }}>
            <Message.Header>
              Huomio!
            </Message.Header>
            Tämä on testisovellus! Sovelluksen tiedot nollataan aika ajoin ilman ennakkovaroitusta.
          </Message.Content>
        </Message>
        {note ? <Notification /> : null}
      </Grid.Column>
    </Grid>
  );
};

export default LoginForm;