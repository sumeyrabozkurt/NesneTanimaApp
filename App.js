import React, {Component} from 'react';
import {View, Text, Button, Alert, StyleSheet, FlatList, TouchableOpacity, Dimensions, Image} from 'react-native';
import {ActionSheet, Root} from "native-base";
import ImagePicker from 'react-native-image-crop-picker';
import { utils } from '@react-native-firebase/app';
import storage from '@react-native-firebase/storage';

const width = Dimensions.get('window').width;
const GOOGLE_CLOUD_VISION_API_KEY = "AIzaSyAHZY0_qdliMRMBakPAX7CvN0qdg2S9PR0";

export default class App extends Component{

  constructor(props){
    super(props);
    this.state = {
      fileList: [],
      objectNumbers:null
    }
  }
    
  submitPost = async (image) => {

    let name = Date.now().toString();
    let reference = storage().ref(name);         
    let task = reference.putFile(image.path);               

    task.then(() => {            
        console.log('Image uploaded to the bucket!');

        reference
          .getDownloadURL()
          .then((url) => {
            console.log(url);
            this.submitToGoogleVisionAPI(name);
          })
          .catch((e) => console.log('getting downloadURL of image error => ', e));
    }).catch((e) => console.log('uploading image error => ', e));

  }

  submitToGoogleVisionAPI = async (imageName) => {
    console.log(imageName);
    let objectNumbers = this.state;
    try {
      let body = JSON.stringify({
        requests: [
          {
            features: [
             { type: "OBJECT_LOCALIZATION", maxResults: 10 }
            ],
            image: {
               source: {
                 imageUri: "https://storage.googleapis.com/nesnetanimaapp.appspot.com/" + imageName
               }
            }
          }
        ]
      });
      let response = await fetch(
        "https://vision.googleapis.com/v1/images:annotate?key=" + GOOGLE_CLOUD_VISION_API_KEY,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          method: "POST",
          body: body
        }
      );
      let responseJson = await response.json();
      console.log(JSON.stringify(responseJson));
      console.log(responseJson.responses[0].localizedObjectAnnotations.length);
      this.setState({
        objectNumbers : responseJson.responses[0].localizedObjectAnnotations.length
      })
      for (i in responseJson.responses[0].localizedObjectAnnotations) {
        console.log(responseJson.responses[0].localizedObjectAnnotations[i].name);
        for(j in responseJson.responses[0].localizedObjectAnnotations[i].boundingPoly.normalizedVertices){
            console.log(responseJson.responses[0].localizedObjectAnnotations[i].boundingPoly.normalizedVertices[j].x,
                          responseJson.responses[0].localizedObjectAnnotations[i].boundingPoly.normalizedVertices[j].y);
        }
      };
    
    } catch (error) {
      console.log(error);
    }
  };
  

  onSelectedImage = (image) =>{

    let newDataImg = this.state.fileList;
    const source = {uri : image.path};
    let item = {

      id : Date.now(),
      url : source,
      content : image.data

    };
    newDataImg.push(item);
    this.setState({fileList : newDataImg});

  };

  takePhotoFromCamera = () =>{
    ImagePicker.openCamera({
    width: 300,
    height: 400
    }).then(image => {
      this.onSelectedImage(image);
      this.submitPost(image);
      console.log(image);
    });
  };

  takePhotoFromGallery = () =>{

    ImagePicker.openPicker({
      width: 300,
      height: 400
    }).then(image => {
      this.onSelectedImage(image);
      this.submitPost(image);
      console.log(image);
    });
  };

  onClickAddImage = () => {

    const BUTTONS = ['Take Photo', 'Choose Photo from Gallery', 'Cancel'];

    ActionSheet.show(

      {options: BUTTONS, 
      cancelButtonIndex : 2, 
      title: 'Select a Photo'},
      
      buttonIndex =>{

        switch (buttonIndex) {

          case 0:
            this.takePhotoFromCamera();
            break;
          case 1:
            this.takePhotoFromGallery();
            break;
          default:
            break
        }
      }
    )
  };
  
  renderItem = ({item, index}) => {
    let {itemViewImage, itemImage} = styles;
    return (

      <View style = {itemViewImage}>

        <Image source = {item.url} style = {itemImage}></Image>
      
      </View>


    )
  };

  render(){
    let {content, btnPressStyle, txtStyle} = styles;
    let {fileList} = this.state;
    let {objectNumbers} = this.state;
    return(
        <Root>
          <View style = {content}>
            <Text > BULUNAN NESNE SAYISI = {this.state.objectNumbers} </Text>
            <FlatList
              data = {this.state.fileList}
              renderItem = {this.renderItem}
              keyExractor = {(item, index) => index.toString()}
              extraData = {this.state}
            ></FlatList>

            <TouchableOpacity onPress = {this.onClickAddImage} style = {btnPressStyle}>
              <Text style = {txtStyle}> Press to Add Image</Text>
            </TouchableOpacity>
          </View>
        </Root>
    );

  }
}

const styles = StyleSheet.create({
  content:{
    flex : 1,
    alignItems : 'center',
    marginTop : 20,
    marginBottom: 30,
    paddingLeft: 30,
    paddingRight: 30
  },

  btnPressStyle:{
    backgroundColor : '#0080ff',
    height : 50,
    width : width - 60,
    alignItems : 'center',
    justifyContent : 'center' 
  },

  txtStyle:{
    color: '#ffffff'
  },

  itemImage:{
    backgroundColor: '#2F455C',
    height: 150,
    width: width-60,
    borderRadius: 8,
    resizeMode: 'contain'
  },

  itemViewImage:{
    alignItems : 'center',
    borderRadius : 8,
    marginTop : 10
  }

});