import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Grid, Header, Button, Segment, Icon } from 'semantic-ui-react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Link } from 'react-router-dom';
import * as Yup from 'yup';
import userService from '../../services/users';
import { setNotification, clearNotification } from '../../reducers/notificationReducer';
import Notification from '../Notification/Notification';
import './RegistrationForm.css';

const RegistrationForm = () => {
  const note = useSelector(state => state.note);

  const dispatch = useDispatch();

  const postNewUser = async (fields, resetForm) => {
    const newUser = {
      user: {
        name: fields.name,
        username: fields.username,
        password: fields.password
      }
    };

    try {
      await userService.addUser(newUser);
      resetForm({ fields: '' });

      dispatch(setNotification({
        type: 'info',
        header: 'Rekisteröinti onnistui',
        content: 'Voit nyt kirjautua sisään kirjautumissivun kautta',
        timeout: 3.5
      }));

    } catch (error) {
      dispatch(setNotification({
        type: 'error',
        header: 'Rekisteröinti epäonnistui',
        content: 'Ole hyvä ja yritä myöhemmin uudelleen',
        timeout: 3.5
      }));
    }
  };

  return (
    <Formik
      initialValues={{
        name: '',
        username: '',
        password: '',
        confirmPassword: ''
      }}
      validationSchema={Yup.object().shape({
        name: Yup.string()
          .required('Nimi on pakollinen tieto')
          .matches(/^\w[a-zA-ZäöåÄÖÅ(\- )]+[\wäöåÄÖÅ]+$/, 'Nimi saa sisältää vain kirjaimia.')
          .min(5, 'Nimi oltava vähintään 5 merkkiä pitkä')
          .max(50, 'Nimen maksimipituus on 50 merkkiä'),
        username: Yup.string()
          .required('Käyttäjätunnus on pakollinen tieto')
          .matches(/^[\w]*[a-zA-ZäöåÄÖÅ]+[\w]$/, 'Käyttäjätunnus saa sisältää vain kirjaimia ja numeroita.')
          .min(5, 'Käyttäjätunnus vähintään 5 merkkiä pitkä')
          .max(12, 'Käyttäjätunnuksen maksimipituus on 12 merkkiä'),
        password: Yup.string()
          .required('Salasana on pakollinen tieto')
          .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/, 'Salasanassa oltava vähintään yksi kirjain, yksi numero ja yksi erikoismerkki.')
          .min(6, 'Salasanan oltava vähintään 6 merkkiä pitkä')
          .max(32, 'Salasanan maksimipituus on 32 merkkiä'),
        confirmPassword: Yup.string()
          .required('Salasanan varmistus on pakollinen tieto')
          .oneOf([Yup.ref('password'), null], 'Salasana ja sen varmistus eivät vastaa toisiaan.')
      })}
      onSubmit={(fields, { resetForm }) => {
        //alert('SUCCESS!!! :-)\n\n' + JSON.stringify(fields, null, 4));
        postNewUser(fields, resetForm);
      }}
    >
      {({ errors, touched }) => (
        <div>
          <Grid textAlign='center' style={{ height: '75vh' }} verticalAlign='middle'>
            <Grid.Column style={{ maxWidth: 350 }}>
              <Header as='h2' color='orange' textAlign='center'>
                Rekisteröi käyttäjätunnus
              </Header>
              <Segment raised>
                <Form id="registrationForm" className='form-container'>
                  <div className='form-row'>
                    <div className='form-group'>
                      <label htmlFor='name'>Nimi:</label>
                      <Field name='name' type='text' placeholder='Etunimi Sukunimi' className={'form-control' + (errors.name && touched.name ? ' is-invalid' : '')} />
                      <ErrorMessage name="name" component="div" className="invalid-feedback" />
                    </div>
                  </div>
                  <div className='form-row'>
                    <div className='form-group'>
                      <label htmlFor='username'>Käyttäjätunnus:</label>
                      <Field name='username' type='text' placeholder='Käyttäjätunnus' className={'form-control' + (errors.username && touched.username ? ' is-invalid' : '')} />
                      <ErrorMessage name="username" component="div" className="invalid-feedback" />
                    </div>
                  </div>
                  <div className='form-row'>
                    <div className='form-group'>
                      <label htmlFor='password'>Salasana:</label>
                      <Field name='password' type='password' placeholder='Salasana' className={'form-control' + (errors.password && touched.password ? ' is-invalid' : '')} />
                      <ErrorMessage name="password" component="div" className="invalid-feedback" />
                    </div>
                  </div>
                  <div className='form-row'>
                    <div className='form-group'>
                      <label htmlFor='confirmPassword'>Toista salasana:</label>
                      <Field name='confirmPassword' type='password' placeholder='Toista salasana' className={'form-control' + (errors.confirmPassword && touched.confirmPassword ? ' is-invalid' : '')} />
                      <ErrorMessage name="confirmPassword" component="div" className="invalid-feedback" />
                    </div>
                  </div>
                  <div className="reg-form-footer-row">
                    <Button
                      secondary
                      type='reset'
                      icon='erase'
                      content='Tyhjennä'
                    />
                    <Button
                      primary
                      type='submit'
                      icon='checkmark'
                      content='Lähetä'
                    />
                  </div>
                </Form>
              </Segment>
              <div className="reg-form-link-back-row">
                <Link to='/login' onClick={() => dispatch(clearNotification())}>
                  <Icon name='arrow alternate circle left outline' />
                  Palaa kirjautumiseen
                </Link>
              </div>
              {note ? <Notification /> : null}
            </Grid.Column>
          </Grid>
        </div>
      )}
    </Formik>
  );
};

export default RegistrationForm;