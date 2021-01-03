import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  Modal,
  Grid,
  Segment,
  Message,
  Checkbox,
  Icon
} from 'semantic-ui-react';
import { updateUserVehicle, removeVehicleFromUser } from '../../reducers/userReducer';
import { clearNotification, setNotification } from '../../reducers/notificationReducer';
import Notification from '../Notification/Notification';
import VehicleInputBlock from './VehicleInputBlock';
import VehicleCoOwnerBlock from './VehicleCoOwnersBlock';

const EditVehicleModal = ({ vehicle, user, users }) => {
  const [openEditVehicleModal, setOpenEditVehicleModal] = useState(false);
  const [openDelVehicleModal, setOpenDelVehicleModal] = useState(false);
  const [name, setName] = useState('');
  const [faultyName, setFaultyName] = useState({ state: false, text: '' });
  const [licensePlateId, setLicensePlateId] = useState('');
  const [faultyLPId, setFaultyLPId] = useState({ state: false, text: '' });
  const [odoMeter, setOdoMeter] = useState('');
  const [faultyOdo, setFaultyOdo] = useState({ state: false, text: '' });
  const [showDelConfirmation, setShowDelConfirmation] = useState(false);
  const [coOwner, setCoOwner] = useState('');
  const [coOwners, setCoOwners] = useState([]);
  const [originalPrimarySelection, setOriginalPrimarySelection] = useState(false);
  const [primarySelection, setPrimarySelection] = useState(false);
  const note = useSelector(state => state.note);

  const dispatch = useDispatch();

  useEffect(() => {
    // These properties are initialized only when the EditVehicle modal is opened.
    if (openEditVehicleModal) {
      if (user.primaryVehicle === vehicle.id) {
        setOriginalPrimarySelection(true);
        setPrimarySelection(true);
      } else {
        setOriginalPrimarySelection(false);
        setPrimarySelection(false);
      }

      setName(vehicle.name);
      setLicensePlateId(vehicle.licensePlateId);
      setOdoMeter(vehicle.odoMeter);
      setCoOwners(vehicle.coOwners);
      setShowDelConfirmation(false);
    }
  },[user, openEditVehicleModal, vehicle]);

  const handleCancelOnClick = () => {
    dispatch(clearNotification());
    setName('');
    setLicensePlateId('');
    setOdoMeter('');
    setCoOwner('');
    setCoOwners([]);
    setPrimarySelection(false);
    setOriginalPrimarySelection(false);
    setShowDelConfirmation(false);
    setFaultyName({ state: false, text: '' });
    setFaultyLPId({ state: false, text: '' });
    setFaultyOdo({ state: false, text: '' });

    setOpenEditVehicleModal(false);
  };

  const handleResetOnClick = () => {
    if (user.primaryVehicle === vehicle.id) {
      setOriginalPrimarySelection(true);
      setPrimarySelection(true);
    } else {
      setOriginalPrimarySelection(false);
      setPrimarySelection(false);
    }

    setName(vehicle.name);
    setLicensePlateId(vehicle.licensePlateId);
    setOdoMeter(vehicle.odoMeter);
    setCoOwners(vehicle.coOwners);
    setShowDelConfirmation(false);
    setFaultyName({ state: false, text: '' });
    setFaultyLPId({ state: false, text: '' });
    setFaultyOdo({ state: false, text: '' });
  };

  // Aux function for providing correct primary vehicle value
  // for the update request sent to server.
  const getPrimaryVehicle = () => {
    if (primarySelection) {
      // User selected this vehicle as primary.
      return vehicle.id;
    } else if (!primarySelection && user.primaryVehicle === vehicle.id) {
      // This was user's primary vehicle and he removed primary tag
      // -> user does not have any primary vehicle now.
      return '';
    } else {
      // User didn't do any changes on primary vehicle settings
      // -> keep the current setting.
      return user.primaryVehicle;
    }
  };

  const handleSaveOnClick = async () => {
    if (!name || !licensePlateId || !odoMeter) {
      dispatch(setNotification({
        type: 'error',
        header: undefined,
        content: 'Virheellinen syöte',
        timeout: 3.5
      }));
    } else {

      dispatch(updateUserVehicle({
        vehicle: {
          id: vehicle.id,
          name,
          licensePlateId,
          odoMeter,
          coOwners: coOwners.map(c => c.id)
        },
        primaryVehicle: getPrimaryVehicle()
      }));

      setName('');
      setLicensePlateId('');
      setOdoMeter('');
      setCoOwner('');
      setCoOwners([]);
      setPrimarySelection(false);
      setOriginalPrimarySelection(false);

      setOpenEditVehicleModal(false);
      setShowDelConfirmation(false);
    }
  };

  const handleDelCancelOnClick = (e) => {
    e.stopPropagation();
    if (e.target === e.currentTarget) {
      setOpenDelVehicleModal(false);
    }
  };

  const handleDelConfirmOnClick = () => {
    dispatch(removeVehicleFromUser(vehicle.id));
    setName('');
    setLicensePlateId('');
    setOdoMeter('');
    setOpenDelVehicleModal(false);
    setOpenEditVehicleModal(false);
  };

  const handleAddCoOwnerOnClick = (e) => {

    // Make sure that given co-owner is not user himself.
    if (coOwner !== user.username) {

      // Make sure that given co-owner hasn't been added already.
      const coOwnerFound = coOwners.find(c => c.username === coOwner);
      if (!coOwnerFound) {

        // Make sure that given co-owner can be found from the service.
        const userFound = users.find(u => u.username === coOwner );
        if (userFound) {

          // Add new co-owner in the list and render it on the screen.
          const updatedCoOwners = [...coOwners];
          updatedCoOwners.push(userFound);
          setCoOwners(updatedCoOwners);
          setCoOwner('');

        } else {
          dispatch(setNotification({
            type: 'error',
            header: undefined,
            content: `Käyttäjää '${coOwner}' ei löydy. Tarkista antamasi tunnus.`,
            timeout: 3.5
          }));
        }

      } else {
        dispatch(setNotification({
          type: 'error',
          header: undefined,
          content: `Käyttäjä '${coOwnerFound.name}' on jo lisätty ajoneuvon toiseksi käyttäjäksi.`,
          timeout: 3.5
        }));
      }

    } else {
      dispatch(setNotification({
        type: 'error',
        header: undefined,
        content: 'Ajoneuvon omistajana et voi asettaa itseäsi toiseksi käyttäjäksi.',
        timeout: 3.5
      }));
    }
  };

  const handleDelCoOwnerOnClick = (user) => {
    let updatedCoOwners = [...coOwners];
    updatedCoOwners = updatedCoOwners.filter(c => c.id !== user.id);
    setCoOwners(updatedCoOwners);
  };

  const handlePrimaryVehicleOnChange = () => {
    primarySelection
      ? setPrimarySelection(false)
      : setPrimarySelection(true);
  };

  // Validator function for odometer input field.
  const handleVehicleNameOnBlur = () => {
    setFaultyName({ state: false, text: '' });

    if (!name) {
      setFaultyName({ state: true, text: 'Kenttä ei saa olla tyhjä.' });
    } else if (name === vehicle.name) {
      setFaultyName({ state: true, text: 'Uusi nimi on sama kuin vanha.' });
    } else if (!(/^[\w]*(([a-zA-ZäöåÄÖÅ]+)|( )|(-))[\w]*$/).test(name)) {
      setFaultyName({ state: true, text: 'Nimi saa sisältää vain kirjaimia ja numeroita sekä yhden välilyönnin tai -viivan.' });
    } else if (name.length < 4) {
      setFaultyName({ state: true, text: 'Nimen oltava vähintään 4 merkkiä pitkä.' });
    } else if (name.length > 20) {
      setFaultyName({ state: true, text: 'Nimen enimmäispituus on 20 merkkiä.' });
    }
  };

  // Validator function for license plate id input field.
  const handleLPIdOnBlur = () => {
    setFaultyLPId({ state: false, text: '' });

    if (!licensePlateId) {
      setFaultyLPId({ state: true, text: 'Kenttä ei saa olla tyhjä.' });
    } else if (licensePlateId === vehicle.licensePlateId) {
      setFaultyLPId({ state: true, text: 'Uusi rekisteritunnus on sama kuin vanha.' });
    } else if (!(/(^[\D]{2,3}(-)[\d]{1,3}$)|(^[C][D](-)[\d]{1,4}$)/).test(licensePlateId)) {
      setFaultyLPId({ state: true, text: 'Rekisteritunnus tulee olla muodossa 2-3 kirjainta, väliviiva ja 1-3 numeroa (CD-alkuisena sallitaan 4 numeroa).' });
    }
  };

  // Validator function for odometer input field.
  const handleOdoMeterOnBlur = () => {
    setFaultyOdo({ state: false, text: '' });

    if (!odoMeter) {
      setFaultyOdo({ state: true, text: 'Kenttä ei saa olla tyhjä.' });
    } else if (odoMeter === vehicle.odoMeter) {
      setFaultyOdo({ state: true, text: 'Uusi matkamittarin lukema on sama kuin vanha.' });
    } else if (isNaN(odoMeter)) {
      setFaultyOdo({ state: true, text: 'Matkamittarin lukema tulee olla numeerinen.' });
    } else if (Number(odoMeter) < 0) {
      setFaultyOdo({ state: true, text: 'Matkamittarin lukema ei saa olla negatiivinen.' });
    } else if (Number(odoMeter) > 5000000) {
      setFaultyOdo({ state: true, text: 'Matkamittarin lukema ei saa olla yli 5 000 000 km.' });
    }
  };

  // Aux function to identify is the new vehicle entry ready for saving.
  // This is used for controlling is the SAVE button enabled or disabled.
  const isEntryReadyForSave = () => {
    if (
      (name && !faultyName.state && name !== vehicle.name) ||
      (licensePlateId && !faultyLPId.state && licensePlateId !== vehicle.licensePlateId) ||
      (odoMeter && !faultyOdo.state && odoMeter !== vehicle.odoMeter) ||
      (primarySelection !== originalPrimarySelection &&
      (!faultyName.state && !faultyLPId.state && !faultyOdo.state)) ||
      JSON.stringify(coOwners) !== JSON.stringify(vehicle.coOwners)
    ) {
      return true;
    }

    return false;
  };

  // Aux function for identifying is the RESET button enabled or disabled.
  // (Reset button is active only if value in any input field has been
  // changed OR any input error message is available).
  const isResetDisabled = () => {
    if (
      name === vehicle.name &&
      primarySelection === originalPrimarySelection &&
      licensePlateId === vehicle.licensePlateId &&
      odoMeter === vehicle.odoMeter &&
      JSON.stringify(coOwners) === JSON.stringify(vehicle.coOwners) &&
      !faultyName.state &&
      !faultyLPId.state &&
      !faultyOdo.state
    ) {
      return true;

    }

    return false;
  };

  return (
    <Modal
      closeIcon={true}
      onClose={() => handleCancelOnClick()}
      onOpen={() => setOpenEditVehicleModal(true)}
      open={openEditVehicleModal}
      closeOnDimmerClick={false}
      closeOnEscape={false}
      trigger={
        <div className='data-row' onClick={() => dispatch(clearNotification())}>
          {
            user.primaryVehicle === vehicle.id
              ? <Icon className='primary-vehicle-icon' name='star' />
              : null
          }
          {vehicle.name} ({vehicle.licensePlateId})
        </div>}
      size='tiny'
    >
      <Modal.Header>Muokkaa ajoneuvoa</Modal.Header>
      <Modal.Content>
        <Grid textAlign='center' verticalAlign='top'>
          <Grid.Column style={{ maxWidth: 400 }}>
            <Segment raised>

              <div className='vehicle-name-container'>
                <VehicleInputBlock
                  label='Ajoneuvon nimi:'
                  name='name'
                  value={name}
                  disabled={user.id !== vehicle.owner.id ? true : showDelConfirmation}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleVehicleNameOnBlur}
                  blockStyle='vehicle-name'
                  inputError={faultyName.state}
                />
                <Checkbox
                  label='Ensisijainen'
                  checked={primarySelection}
                  className='primary-checkbox'
                  onChange={() => handlePrimaryVehicleOnChange()}
                />
              </div>

              {
                faultyName.state
                  ? <Message error content={faultyName.text} />
                  : null
              }

              <VehicleInputBlock
                label='Rekisterinumero:'
                name='licensePlateId'
                value={licensePlateId}
                disabled={user.id !== vehicle.owner.id ? true : showDelConfirmation}
                onChange={(e) => setLicensePlateId(e.target.value)}
                onBlur={handleLPIdOnBlur}
                inputError={faultyLPId.state}
              />

              {
                faultyLPId.state
                  ? <Message error content={faultyLPId.text} />
                  : null
              }

              <VehicleInputBlock
                label='Matkamittarin lukema:'
                name='odoMeter'
                value={odoMeter}
                disabled={user.id !== vehicle.owner.id ? true : showDelConfirmation}
                onChange={(e) => setOdoMeter(e.target.value)}
                onBlur={handleOdoMeterOnBlur}
                inputError={faultyOdo.state}
              />

              {
                faultyOdo.state
                  ? <Message error content={faultyOdo.text} />
                  : null
              }

              <VehicleInputBlock
                label='Ajoneuvon omistaja:'
                name='owner'
                value={vehicle.owner.name}
                disabled={true}
              />

              <VehicleCoOwnerBlock
                delDisabled={user.id !== vehicle.owner.id ? true : false}
                coOwner={coOwner}
                coOwners={coOwners}
                handleDelCoOwnerOnClick={handleDelCoOwnerOnClick}
                handleCoOwnerONChange={(e) => setCoOwner(e.target.value)}
                handleAddCoOwnerOnClick={handleAddCoOwnerOnClick}
              />

              {note ? <Notification /> : null}

            </Segment>

            {
              user.id === vehicle.owner.id
                ? null
                :
                <Message
                  warning
                  header='Muokkaus lukittu!'
                  content='Ajoneuvon käyttäjänä voit muokata vain Ensisijainen-tietoa. Muiden tietojen muokkaus edellyttää Omistaja-roolia.'
                />
            }

          </Grid.Column>
        </Grid>
      </Modal.Content>
      <Modal.Actions className='vehicle-modal-actions'>
        <Button
          color='blue'
          content='Palauta'
          icon='erase'
          onClick={handleResetOnClick}
          disabled={isResetDisabled()}
        />

        <Button
          color='red'
          content='Poista'
          icon='delete'
          disabled={user.id !== vehicle.owner.id ? true : false}
          onClick={() => setOpenDelVehicleModal(true)}
        />

        <Button
          content="Tallenna"
          icon='checkmark'
          onClick={handleSaveOnClick}
          positive
          disabled={!isEntryReadyForSave()}
        />
      </Modal.Actions>

      <Modal
        closeIcon={true}
        onClose={() => setOpenDelVehicleModal(false)}
        onOpen={() => setOpenDelVehicleModal(true)}
        open={openDelVehicleModal}
        closeOnDimmerClick={false}
        closeOnEscape={false}
        size='tiny'
        className='del-vehicle-modal'
      >
        <Modal.Content>
          <div className='del-vehicle-modal-content'>
            Oletko varma, että haluat poistaa tämän ajoneuvon ja kaikki siihen liittyvät tankkaukset?
          </div>
        </Modal.Content>
        <Modal.Actions>
          <Button
            color='black'
            content='Peruuta'
            onClick={handleDelCancelOnClick}
          />

          <Button
            color='red'
            content='Poista'
            onClick={handleDelConfirmOnClick}
          />
        </Modal.Actions>
      </Modal>

    </Modal>
  );
};

export default EditVehicleModal;