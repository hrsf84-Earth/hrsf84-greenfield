import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import Login from './components/Login.jsx'
import Carousel from './components/Carousel.jsx'
import Search from './components/search.jsx'
import $Post from './services/Post.jsx'
import $Get from './services/Get.jsx'
import Axios from 'axios'

export default class App extends React.Component {
  constructor() {
    super();
    this.src = [];
    this.isRetrievingNewPage = false;

    this.state = {
      confirmedUsername: null, //username that is used if server says user is signed in
      currentPhotoIndex: 16,
      view: 'home',
      favoritesView: '',
      searchTerm: 'tigers',
      searchPagination: 1
    }

    this.handlePhotoNavigationClick = this.handlePhotoNavigationClick.bind(this);
    this.viewSelect = this.viewSelect.bind(this);
    this.saveUserName = this.saveUserName.bind(this);
  }

  componentWillMount() {
    var context = this;

    Axios({
      url: '/photos',
      method: 'GET',
      header: {"Access-Control-Allow-Origin": "*"}
      ,
      proxy: {
        host: window.location.hostname,
        port: window.location.port
      }
    })
    .then(function (data) {
      if (data) {
        context.src = data.data;
        context.forceUpdate();
      }
    })
    .catch(function (err) {
      context.src = [{urls:{regular:'http://images2.fanpop.com/image/photos/13300000/Cute-Puppy-puppies-13379766-1280-800.jpg'}}];
        context.forceUpdate();
      // console.log('Error retrieving list of photos from server');
      console.log('Error retrieving list of photos from server', err);
    })
  }


  handlePhotoNavigationClick(direction = 1) {
    //direction positive, go to next; neg then go previous index
    // Overview: When user clicks on a nagivation button, will change the centeral image to a new index of src
    var numberOfPhotos = this.src.length;
    var newIndex = this.state.currentPhotoIndex + direction;
    if (this.state.currentPhotoIndex > this.src.length - 6 && !this.isRetrievingNewPage) {
      this.isRetrievingNewPage = true
      this.addPhotosToSrc(true)
        .then ( () => {
          this.setState({currentPhotoIndex: newIndex}, () => {this.isRetrievingNewPage = false;})
        })
        .catch(err => {
          this.isRetrievingNewPage = false;
        })
    } else if ((this.state.currentPhotoIndex < 6 ) && !this.isRetrievingNewPage) {
      this.isRetrievingNewPage = true;
      this.addPhotosToSrc(false)
        .then ( () => {
          newIndex = this.state.currentPhotoIndex += 30;
          this.setState({currentPhotoIndex: newIndex}, () => {
            this.isRetrievingNewPage = false;
            console.log (this.state.currentPhotoIndex)
          })
        })
        .catch(err => {
          this.isRetrievingNewPage = false;
        })
    } else {
      this.setState({
        currentPhotoIndex: newIndex
      }, console.log("Photo index", this.state.currentPhotoIndex));
    }
  }


  onSearch() {
    var context = this;
    console.log(this.state.searchTerm);
    Axios({
    url: '/photos',
    method: 'GET',
    header: {"Access-Control-Allow-Origin": "*"},
    params: {
      query: context.state.searchTerm,
      page: context.state.searchPagination
    },
    proxy: {
      host: window.location.hostname,
      port: window.location.port
    }
  })
    .then(function (photoData) {
      if(photoData){
        // console.log('ON SUCCESS', photoData);
        context.src = photoData.data;
        context.setState({
          searchPagination: 1,
          currentPhotoIndex: 16
        });
        console.log('THIS.SRC STATE', context.src);
        console.log('PAGINATION STATE', context.state.searchPagination);
      }
    })
    .catch(function (err) {
      context.src = [{urls:{regular:'http://images2.fanpop.com/image/photos/13300000/Cute-Puppy-puppies-13379766-1280-800.jpg'}}];
      context.forceUpdate();
      // console.log('err', xhr, status, error);
      console.log('Error retrieving list of photos from server', err);
    })
  }


  addPhotosToSrc (sendToEnd = true) {
    return new Promise ((resolve, revoke) => {
      $Get('/photos/',{
        query: this.state.searchTerm,
        page: this.state.searchPagination + 1
      })
      .then ((photoData) => {
        if (sendToEnd) { this.src.push(...photoData); }
        else { this.src = photoData.concat(this.src); }
        this.setState({searchPagination: this.state.searchPagination + 1 }, () => {
          console.log ('page', this.state.searchPagination);
          console.log('THIS.SRC STATE',this.src);
          resolve();
        });
      })
      .catch(err => {
        console.error ('Error searching for photos', err)
        revoke(err)
      })
    })
  }


  onSearchInput(e) {
    this.setState({
      searchTerm: e.target.value
    });
  }


  viewSelect (e) {
    //this function will change the 'login/signup/logoff' view.
    //either enter a quoted desired change of view, ie 'home' or 'login'
    // or pass in a react event variable with the id having the desired location seperated with a '-'
    //ie btn-logout or click-signup
    var selected;
    try {
      selected = e.target.id.split('-');
    } catch (err) {
      selected = e;
    }

    console.log('THE SELECTED', selected);
    var view;
    if (selected.indexOf('signup') !== -1) {
      view = 'signup';
    } else if (selected.indexOf('login') !== -1){
      view = 'login';
    } else if (selected.indexOf('logout') !== -1){
      view = 'logout';
    } else {
      view = 'home';
    }
    this.setState({view: view})
  }

  saveUserName(username) {
    if (!username) {
      return
    }
    this.setState({confirmedUsername: username})
  }


  viewLogin () {
    if (this.state.view === 'login' || this.state.view === 'signup') {
      return (
        <div className="popup">
          <div className="popup_inner">
            {/* <div className="header-left">Impulse</div> */}
            <Login
              view={this.state.view}
              switchViews={this.viewSelect.bind(this)}
              saveUserName={this.saveUserName}
            />
          </div>
        </div>
      )
    } else {
      return (null)
    }
  }

  viewLogoutOrHome () {
    if (this.state.view === 'logout' ) {
      return (
        <Login id="login"
        click={this.viewSelect.bind(this)}
        switchViews={this.viewSelect.bind(this)}
        view={this.state.view}
        confirmedUsername={this.state.confirmedUsername}
      />
      )
    } else {
      return (
        <Login id="login"
        click={this.viewSelect.bind(this)}
        switchViews={this.viewSelect.bind(this)}
        // view={'logout'}
      />
      )
    }
  }

  registerFavorite(input){

    if(this.state.confirmedUsername){
      console.log('You are logged in', this.state.confirmedUsername);
      console.log('INSIDE REGISTER FAVORITE', input);
      var context = this;
      Axios({
      url: '/favorites',
      method: 'POST',
      header: {"Access-Control-Allow-Origin": "*"},
      params: {
        username: context.state.confirmedUsername,
        photo: input
      },
      proxy: {
        host: window.location.hostname,
        port: window.location.port
      }
    })
      .then(function (success) {
        console.log('SUCCESS');
      })
      .catch(function (err) {
        console.log('ERROR');
      })
    } else {
      console.log('You are not logged in');
    }

  }

  render () {
    // if (this.state.view === 'login' || this.state.view === 'signup') {
    //   return (
    //     <div className="grid popup">
    //       <div className="header-left">Impulse</div>
    //       <Login
    //         view={this.state.view}
    //         switchViews={this.viewSelect.bind(this)}
    //       />
    //     </div>
    //   )
    // } else {
      return (
        <div className="grid">
        {this.viewLogin()}
          <div id="impulse-header" className="header-left">Impulse</div>
            {this.viewLogoutOrHome ()}
            <Search id="search"  onSearch={this.onSearch.bind(this)} onSearchInput={this.onSearchInput.bind(this)} />
          <div className="left auto-center">
            <button onClick={() => this.handlePhotoNavigationClick(-1)}><i className="fa fa-5x fa-angle-left left-middle" aria-hidden="true" ></i></button>
          </div>
          <Carousel registerFavorite={this.registerFavorite.bind(this)} currentPhoto={this.src[this.state.currentPhotoIndex]} />

          <div className="right auto-center">

            <button onClick={() => this.handlePhotoNavigationClick(1)}><i className="fa fa-5x fa-angle-right right-middle" aria-hidden="true"  > </i></button>
          </div>
        </div>
      )
    // }
  }
}

if(typeof window !== 'undefined') {
  ReactDOM.render(<App />, document.getElementById('app'));
}
