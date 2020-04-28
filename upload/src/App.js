import axios from 'axios'; 
import React,{Component} from 'react';
import { css } from "@emotion/core";
import PropagateLoader from "react-spinners/PropagateLoader";
import './upload.css';
import AnimatedModal from "./userTrain";
import InfoModal from "./infoModal";
import Dropzone from 'react-dropzone'
import Banner from 'react-js-banner';
import RefreshIcon from '@material-ui/icons/Refresh';
import {IconButton} from '@material-ui/core';
import ReactGA from 'react-ga';
const trackingId = 'UA-148371899-1'
ReactGA.initialize(trackingId);
const override = css`
  display: block;
  margin: 0 auto;
  border-color: red;
`;
class App extends Component {
    constructor(props) {
    super(props);
    this.state = { 
      error:          false,
      fail:           false,
      predictions:    [],
      loading:        false,
      fileName:       '',
      hash:           '',
      vote:           [],
      showResult:     false,
      bannerStatus:   false,
      reload:         false
    };
    this.onDrop = this.onDrop.bind(this);
    this.clear = this.clear.bind(this);
    this.showBanner = this.showBanner.bind(this);
  }
  clear(){
    this.setState({
      error:          false,
      fail:           false,
      predictions:    [],
      loading:        false,
      fileName:       '',
      hash:           '',
      vote:           [],
      showResult:     false,
      bannerStatus:   false,
      reload:         true
    })
    ReactGA.event({category: 'clear', action: 'reset'});
  }
  showBanner(status){
    this.setState(status)
    setTimeout(
      function() {
          this.setState({bannerStatus:  false, error: false, fail: false});
      }
      .bind(this),
      3000
    )
  }
  async onDrop(event) {
    ReactGA.event({category: 'onDrop', action: 'upload'});
    this.setState({
      predictions:    [],
      loading:        true,
      fileName:       '',
      hash:           '',
      vote:           [],
      showResult:     false
    })
    var pictureFiles = event
    var reader = new FileReader();
    reader.onload = function(){
      var output = document.getElementById('preview');
      output.src = reader.result;
    };
    reader.readAsDataURL(pictureFiles[0]);
    var canvas = document.getElementById("imageCanvas");

    var ctx = canvas.getContext("2d"); 
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if(pictureFiles.length > 0){
      const formData = new FormData();
      formData.append( 
        "image", 
        pictureFiles[0],
        pictureFiles[0].name
      );
      var imagePost = async () =>{
        ReactGA.event({category: 'onDrop', action: 'requestServer'});
        try{
          return await axios.post("https://joyuriz.shop/imageUpload", formData)
        } catch(error){
          console.log(error)
        }
      }
      var response = await imagePost()
      if(!response){
        ReactGA.event({category: 'onDrop', action: 'noResponse'});
        this.showBanner({error : true})
      }
      else{
        var img = document.getElementById("preview");
        canvas.width  = img.width;
        canvas.height = img.height;
        if(response.data.success === true){
          ReactGA.event({category: 'onDrop', action: 'success'});
          ctx.lineWidth = "5";
          ctx.strokeStyle = "lightgreen";
          var {top , bottom, left, right} = response.data
          ctx.rect(left, top, (right-left), (bottom-top));
          ctx.drawImage(img, 0, 0, img.width, img.height);
          ctx.stroke();
              
          this.setState({
            predictions: [((text)=>{
              return ({'Yuri': '조유리', 'Yena': '최예나', 'Chaewon': '김채원'})[text]
            })(response.data.predictions)
          ],
            loading :     false,
            fileName:     response.data.path,
            hash:         response.data.hash,
            vote:         [response.data.voteChaewon, response.data.voteYuri, response.data.voteYena],
            showResult:   true
          })
        }
        else{
          ctx.drawImage(img, 0, 0, img.width, img.height);
          this.setState({
            predictions: ["fail to find"],
            loading : false,
            fileName: response.data.path,
            hash:     response.data.hash
          })
          this.showBanner({fail : true})
        }
      }
    }
  }

  render() {
    return (
      <div className="back">
        <Banner 
          className="banner"
          title="응답이 제출되었습니다."
          showBanner={this.state.bannerStatus}
        />
        <Banner 
          css={{backgroundColor:'red', color:'white'}}
          className="banner"
          title="잘못된 파일이거나, 서버가 응답할 수 없습니다."
          showBanner={this.state.error}
        />
        <Banner 
          css={{backgroundColor:'yellow'}}
          className="banner"
          title="얼굴을 찾을 수 없습니다."
          showBanner={this.state.fail}
        />
      <div className="bodyDiv">
        <InfoModal></InfoModal>
        <img className="preview" id="preview" />
        <div className="upload">
            <IconButton className="iconButton" onClick={this.clear} size="small">
              <RefreshIcon className="refresh" fontSize="large"/>
            </IconButton>
            <div className="upload-files">
              <header>
              <p>
              <span className="up">조유리즈</span>
              <span className="load">판별기</span>
              </p>
              </header>
            <div className="body" id="drop">         
              {
                !this.state.loading && !this.state.showResult ?(
                  <div className="uploadBox">
                    <Dropzone multiple={false} onDrop={acceptedFiles => this.onDrop(acceptedFiles)}>
                      {({getRootProps, getInputProps}) => (
                        <section className="dropSection">
                          <div className="dropBox" {...getRootProps(this.style)}>
                            <input className="dropzone" {...getInputProps({
                              type:'file',
                              accept:'image/*'
                            })} />
                            <div className="dropText">
                            <p className={this.state.reload ? 'nomalP' : 'fadeP'}>업로드할 파일을 드래그하거나</p> 
                            <p className={this.state.reload ? 'nomalP' : 'fadeP'}>박스를 
                            <span style={{color:'lightBlue'}}> 클릭</span>해주세요</p>
                            </div>
                          </div>
                        </section>
                      )}
                    </Dropzone>
                  </div>
                ) : (
                  <div className="imageBox">
                    <div className="imageTable">
                    <canvas className="imageCanvas" id="imageCanvas">이 브라우저는 'canvas'기능을 제공하지 않습니다.</canvas>
                    {
                      this.state.showResult ?(
                      <div className="resultBox">
                        <div className="resultDiv">분석 결과 : {this.state.predictions[0]}</div>
                        <div className="resultDiv">
                          <AnimatedModal 
                            banner={this.showBanner}
                            clear={this.clear}
                            fileName={this.state.fileName} 
                            hash={this.state.hash} 
                            prediction={this.state.predictions[0]}/>
                        </div>
                      </div>
                      ) :null
                    }
                    <div className="loadingBox">
                        <PropagateLoader
                          css={override}
                          size={25}
                          color={"#FF509F"}
                          loading={this.state.loading}
                        />
                    </div>
                    </div>
                  </div>
                  )
              }
            </div>
            </div>
        </div>  

      </div>
      </div>
    );
  }
}
  
export default App; 

