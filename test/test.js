import { use, expect, should, assert } from 'chai'
import { default as chaiHttp, request } from 'chai-http'
import { parse } from 'node-html-parser'
import app from '../app.js' // Import your app

use(chaiHttp)

it('/ route responds as expected', done => {
  // request the / route and check the validity of the response
  request
    .execute(app)
    .get('/')
    .end((err, res) => {
      expect(err).to.be.null // not null
      expect(res).to.have.status(200) // HTTP response status code
      expect(res).to.be.html // HTTP response content type header
      expect(res.text).to.equal('Goodbye world!') // correct text
      done()
    })
})

it('/html-example route responds as expected', done => {
  // request the /html-example route and check the validity of the response
  request
    .execute(app)
    .get('/html-example')
    .end((err, res) => {
      expect(err).to.be.null // not null
      expect(res).to.have.status(200) // HTTP response status code
      expect(res).to.be.html // HTTP response content type header
      expect(res.text).to.contain('Hello!') // correct text
      const page = parse(res.text)
      expect(page.querySelector('h1').innerHTML).to.equal('Hello!') // check inner text of h1 element
      expect(page.querySelector('p').outerHTML).to.equal(
        '<p>Welcome to this HTML document, served up by Express</p>'
      ) // check HTML structure of the p element
      done()
    })
})

it('/json-example route responds as expected', done => {
  // request the /json-example route and check the validity of the response
  request
    .execute(app)
    .get('/json-example')
    .end((err, res) => {
      expect(err).to.be.null // not null
      expect(res).to.have.status(200) // HTTP response status code
      expect(res).to.be.json // HTTP response content type header
      expect(res.body).to.have.property('title').that.equals('Hello!') // JSON object field
      expect(res.body)
        .to.have.property('imagePath')
        .that.equals('/static/images/donkey.jpg')
      done()
    })
})

it('/middleware-example route responds as expected', done => {
  // request the /middleware-example route and check the validity of the response
  request
    .execute(app)
    .get('/middleware-example')
    .end((err, res) => {
      expect(err).to.be.null // not null
      expect(res).to.have.status(200) // HTTP response status code
      expect(res).to.be.html // HTTP response content type header
      expect(res.text).to.contain('First middleware function run!') // correct text
      expect(res.text).to.contain('Second middleware function run!') // correct text
      done()
    })
})

it('/post-example route responds as expected', done => {
  // mock data for the POST request
  const testName = 'Foo'
  const testEmail = 'fb1258@nyu.edu'
  const testAgree = 'true' // as string, which is how it would be received on back-end via HTTP POST

  // request the /post-example route and check the validity of the response
  request
    .execute(app)
    .post('/post-example')
    .set('content-type', 'application/x-www-form-urlencoded')
    .send({ your_name: testName, your_email: testEmail, agree: testAgree }) // send the mock data with the POST request
    .end((err, res) => {
      expect(err).to.be.null // not null
      expect(res).to.have.status(200) // HTTP response status code
      expect(res).to.be.json // HTTP content type header
      // check content of response object
      expect(res.body)
        .to.have.property('status')
        .that.equals('amazing success!')
      // check subfields of response object
      expect(res.body.your_data).to.have.property('name').that.equals(testName)
      expect(res.body.your_data)
        .to.have.property('email')
        .that.equals(testEmail)
      expect(res.body.your_data)
        .to.have.property('agree')
        .that.equals(testAgree)
      done()
    })
})
