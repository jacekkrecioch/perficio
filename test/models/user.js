"use strict";

var helper = require('../test_helper'),
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  expect = require('chai').expect,
  mongoose = require('mongoose'),
  User = mongoose.model('User');

describe("user model", function() {

  var users, template1, template2, achievement1, achievement2, achievement3;

  beforeEach(function(done) {
    helper.clearDb(function() {
      helper.factories.createList('User', 2, function(err, createdUsers) {
        users = createdUsers;
        helper.factories.create('Template', {
          author: createdUsers[0]
        }, function(err, createdTemplate1) {
          template1 = createdTemplate1;
          helper.factories.create('Template', {
            author: createdUsers[1]
          }, function(err, createdTemplate2) {
            template2 = createdTemplate2
            helper.factories.create('Achievement', {
              owner: createdUsers[0],
              grantedBy: [createdUsers[1]],
              template: createdTemplate1
            }, function(err, createdAchievement1) {
              achievement1 = createdAchievement1;
              helper.factories.create('Achievement', {
                owner: createdUsers[1],
                grantedBy: [createdUsers[0]],
                template: createdTemplate2
              }, function(err, createdAchievement2) {
                achievement2 = createdAchievement2;
                helper.factories.create('Achievement', {
                  owner: createdUsers[1],
                  grantedBy: [createdUsers[0]],
                  template: createdTemplate1
                }, function(err, createdAchievement3) {
                  achievement3 = createdAchievement3;
                  done();
                });
              });
            });
          });
        });
      });
    });
  });

  describe('#toJSONExtended', function() {
    it('merges the passed object into the user', function() {
      var jsonUser = users[0].toJSONExtended({
        photoUrl: 'someNewUrl',
        newProp: 'prop'
      });
      expect(jsonUser._id.toString()).to.equal(users[0].id);
      expect(jsonUser.name).to.equal(users[0].name);
      expect(jsonUser.email).to.equal(users[0].email);
      expect(jsonUser.photoUrl).to.equal('someNewUrl');
      expect(jsonUser.newProp).to.equal('prop');
    });
  });

  describe('#getAchievementsAndTemplates', function() {
    it('gets achieved and unachieved achievements', function(done) {
      users[0].getAchievementsAndTemplates(function(err, result) {
        expect(err).to.be.null;
        expect(result.achieved.length).to.equal(1);
        expect(result.achieved[0].id).to.equal(achievement1.id);
        expect(result.achieved[0].owner).to.be.undefined;
        expect(result.achieved[0].template.toString()).to.equal(template1.id);
        expect(result.achieved[0].grantedBy[0].name).to.equal(users[1].name);
        expect(result.achieved[0].grantedBy[0].photoUrl).to.equal(users[1].photoUrl);
        expect(result.unachieved[0].id).to.equal(template2.id);
        expect(result.unachieved[0].owner).to.be.undefined;
        expect(result.unachieved[0].template).to.be.undefined;
        expect(result.unachieved[0].grantedBy).to.be.undefined;
        done();
      });
    });
  });

  describe('#getAchievements', function() {
    it('gets achieved achievements', function(done) {
      users[0].getAchievements('name', function(err, result) {
        expect(err).to.be.null;
        expect(result.length).to.equal(1);
        expect(result[0].id).to.equal(achievement1.id);
        expect(result[0].owner).to.be.undefined;
        expect(result[0].template.toString()).to.equal(template1.id);
        expect(result[0].grantedBy[0].name).to.equal(users[1].name);
        expect(result[0].grantedBy[0].photoUrl).to.equal(users[1].photoUrl);
        done();
      });
    });

    it('uses the order provided', function(done) {
      users[1].getAchievements('-name', function(err, result) {
        expect(err).to.be.null;
        expect(result.length).to.equal(2);
        expect(result[0].id).to.equal(achievement3.id);
        expect(result[1].id).to.equal(achievement2.id);
        done();
      });
    });
  });

  describe('.verify', function() {
    it("returns an error message when user email doesn't match the pattern", function(done) {
      User.verify(null, null, {
        emails: [{
          value: 'test@test.com'
        }]
      }, function(err, user, messageObj) {
        expect(err).to.be.null;
        expect(user).to.be.false;
        expect(messageObj.message).to.eq("User's email doesn't match the required pattern");
        done();
      });
    });

    it("returns the user if it already exists", function(done) {
      User.verify(null, null, {
        emails: [{
          value: users[0].email
        }]
      }, function(err, user, messageObj) {
        expect(err).to.be.null;
        expect(user.id).to.equal(users[0].id);
        expect(messageObj).to.be.undefined;
        done();
      });
    });

    it("it creates a user if it doesn't exist and returns it", function(done) {
      User.verify(null, null, {
        emails: [{
          value: 'luke@rebelion.com'
        }],
        displayName: 'Luke Skywalker',
        _json: {
          picture: 'APicture'
        }
      }, function(err, user, messageObj) {
        expect(err).to.be.null;
        expect(user).to.be.ok;
        expect(user.email).to.equal('luke@rebelion.com');
        expect(user.name).to.equal('Luke Skywalker');
        expect(user.photoUrl).to.equal('APicture');
        expect(messageObj).to.be.undefined;
        User.findById(user.id, function(err, usr) {
          expect(user.id).to.equal(usr.id);
          done();
        })
      });
    });
  });
});
