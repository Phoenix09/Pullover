import React from 'react'
import { connect } from 'react-redux'
import { Col, Row } from 'react-bootstrap'

import Spinner from './Spinner'
import Debug from '../lib/debug'
import pushover from '../services/Pushover'
import store from '../services/Store'
import { logout, setDeviceData } from '../actions/Pushover'
import { connectToPushover } from '../services/ConnectionManager'
import Analytics from '../services/Analytics'

const debug = Debug('DeviceRegistration')

class DeviceRegistration extends React.Component {
  constructor() {
    super()
    this.state = {
      spinner: false,
      error: false,
      deviceName: ''
    }
    this.onChangeName = this.onChangeName.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  componentDidMount() {
    Analytics.page('DeviceRegistration')
  }

  render() {
    const formGroupClass = (this.state.error) ? 'form-group has-error' : 'form-group'
    const infoClass = (this.state.error) ? 'text-danger' : 'text-muted'
    const infoText = (this.state.error) ? this.state.error : 'You will need to do this only once.'

    return (
      <div>
        <Spinner active={this.state.spinner}/>
        <Row>
          <Col md={8} mdOffset={2}>
            <h1 className="center-block">Register this device</h1>
            <p className={infoClass}>{infoText}</p>
            <form className="form-horizontal" role="form">
              <div className={formGroupClass}>
                <Col xs={8} xsOffset={2}>
                  <label htmlFor="devicename" className="control-label hide">Device name</label>
                  <input type="text" className="form-control" id="devicename" value={this.state.deviceName}
                         placeholder="Device name" onChange={this.onChangeName}/>
                </Col>
              </div>
              <br/>
              <div className="form-group">
                <Col xs={8} xsOffset={2}>
                  <button type="submit" className="btn btn-primary"
                          onClick={this.handleSubmit}>Register
                  </button>
                </Col>
              </div>
            </form>
            <br/>
            <br/>
            <span className="text-muted"><b>Current user:</b> {this.props.userEmail} (<a href="#" onClick={this.logout}
                                                                                         alt="Logout">Logout</a>)
            </span>
          </Col>
        </Row>
      </div>
    )
  }

  onChangeName(event) {
    this.setState({
      deviceName: event.target.value
    })
  }

  handleSubmit(e) {
    e.preventDefault()
    // Display loading overlay
    this.setState({ spinner: true })
    // Get deviceName parameters
    const deviceName = this.state.deviceName.trim()
    // Try to register device
    pushover.registerDevice({ deviceName })
      .then(this.registrationSuccessful.bind(this))
      .catch(this.registrationFailed.bind(this))
  }

  registrationFailed(error) {
    debug.log('REGISTRATION-ERR', error)
    this.setState({
      error: error.message,
      spinner: false
    })
  }

  registrationSuccessful(response) {
    const deviceName = this.state.deviceName.trim()
    store.dispatch(setDeviceData({
      deviceName,
      deviceId: response.id
    }))
    // No need to transition because isDeviceRegistered is a state monitored by redux
    // Once true the active route will be shown automatically by App.js

    // Now we are ready to connect to pushover
    try {
      connectToPushover()
    }
    catch (e) {
      debug.log(e, e.stack)
    }
  }

  logout() {
    store.dispatch(logout())
  }
}

// Which props should be injected from redux store?
function select(state) {
  return {
    userEmail: state.pushover.userEmail
  }
}

export default connect(select)(DeviceRegistration)
