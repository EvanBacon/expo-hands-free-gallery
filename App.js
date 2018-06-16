import React, { Component } from 'react';
import {
  Text,
  ScrollView,
  Image,
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Constants, AR } from 'expo';
import Lightbox from './Lightbox';

// You can import from local files
import AssetExample from './components/AssetExample';
import ExpoTHREE, { THREE, AR as ThreeAR } from 'expo-three';
// or any pure javascript modules available in npm
import { Card } from 'react-native-elements'; // Version can be specified in package.json
import { View as GraphicsView } from 'expo-graphics';
const blendShapes = [
  // AR.BlendShapes.BrowDownL,
  // AR.BlendShapes.CheekPuff,
  AR.BlendShapes.EyeLookInL,
  AR.BlendShapes.EyeLookOutL,
  AR.BlendShapes.EyeLookDownL,
  AR.BlendShapes.EyeLookUpL,
  AR.BlendShapes.EyeBlinkL,
  AR.BlendShapes.EyeBlinkR,
  AR.BlendShapes.MouthPucker,
];

const Settings = {
  pageTurning: false,
  zooming: true,
  panning: true,
};

export default class App extends React.PureComponent {
  state = {
    maximumZoomScale: 2,
  };
  componentDidMount() {
    THREE.suppressExpoWarnings(true);
    ThreeAR.suppressWarnings();

    const hasFace = anchors => {
      for (let anchor of anchors) {
        if (anchor.type === AR.AnchorTypes.Face) {
          return true;
        }
      }
    };
    AR.onAnchorsDidUpdate(({ anchors, eventType }) => {
      // (EvanBacon): I don't think you can track more than one face but, better to be safe than sorry I guess...

      if (hasFace(anchors)) {
        // console.log("f")
        /*
        
        After we know a face anchor is found, we can request frame data regarding the face.
        There is a lot of data so here we are just getting 2 blendShapes. 
        If you just return `true` it will get everything.
        You can also get the geometry but I don't recommend this as it's experimental.
        */
        const frame = AR.getCurrentFrame({
          [AR.FrameAttributes.Anchors]: {
            [AR.AnchorTypes.Face]: {
              // geometry: true,
              blendShapes,
            },
          },
        });
        for (let anchor of frame.anchors) {
          if (anchor.type === AR.AnchorTypes.Face) {
            this.handleFace(anchor, eventType);
          }
        }
      }
    });
  }

  get lightbox() {
    return (this._lightboxContainer || {}).lightbox;
  }

  winkedLeft = () => {
    if (this.lightbox) this.lightbox.next();
    console.log('wink left');
  };
  winkedRight = () => {
    if (this.lightbox) this.lightbox.previous();

    console.log('wink right');
    // this.lightbox.next();
  };

  handleFace = (anchor, eventType) => {
    const { blendShapes, transform } = anchor;

    const {
      [AR.BlendShapes.BrowDownL]: leftEyebrow,
      [AR.BlendShapes.CheekPuff]: cheekPuff,
      [AR.BlendShapes.EyeLookInL]: eyeLookInL,
      [AR.BlendShapes.EyeLookOutL]: eyeLookOutL,
      [AR.BlendShapes.EyeBlinkL]: blinkL,
      [AR.BlendShapes.EyeBlinkR]: blinkR,
      [AR.BlendShapes.MouthPucker]: mouthPucker,
      [AR.BlendShapes.EyeLookDownL]: eyeLookDownL,
      [AR.BlendShapes.EyeLookUpL]: eyeLookUpL,
    } = blendShapes;

    // if (!this.lightbox) {
    //   return;
    // }

    if (Settings.pageTurning) {
      const EYE_CLOSED_AMOUNT = 0.4;
      const EYE_OPENED_AMOUNT = 0.0001;
      // console.log(blinkL);
      if (this.openedEyeL && blinkL > EYE_CLOSED_AMOUNT) {
        this.openedEyeL = false;
        this.winkedLeft();
        console.log('L closed');
      } else if (!this.openedEyeL && blinkL < EYE_OPENED_AMOUNT) {
        console.log('L opened');
        this.openedEyeL = true;
      }

      if (this.openedEyeR && blinkR > EYE_CLOSED_AMOUNT) {
        this.openedEyeR = false;
        this.winkedRight();
        console.log('R closed');
      } else if (!this.openedEyeR && blinkR < EYE_OPENED_AMOUNT) {
        console.log('R opened');

        this.openedEyeR = true;
      }
    }

    let trans = { x: 0, y: 0, scale: 1 };

    if (Settings.zooming) {
      const PUCKER_MAX = 0.9;
      const PUCKER_MIN = 0.05;
      const delta = PUCKER_MAX - PUCKER_MIN;
      const zoomLevel =
        (Math.min(PUCKER_MAX, Math.max(PUCKER_MIN, mouthPucker)) - PUCKER_MIN) /
        delta;

      let maximumZoomScale = (this.lightbox.currentPage || {}).maximumZoomScale;
      // console.log(zoomLevel);

      trans.scale = 1 + zoomLevel;
      // let lightbox = this.lightbox;
      // if (lightbox && lightbox.currentPage) {
      //   lightbox.currentPage.zoomWithAmount(1 - zoomLevel);
      // }

      // if (this.openedEyeL && blinkL > EYE_CLOSED_AMOUNT) {
      //   this.openedEyeL = false;
      //   this.winkedLeft();
      //   console.log('L closed');
      // } else if (!this.openedEyeL && blinkL < EYE_OPENED_AMOUNT) {
      //   console.log('L opened');
      //   this.openedEyeL = true;
      // }

      // if (this.openedEyeR && blinkR > EYE_CLOSED_AMOUNT) {
      //   this.openedEyeR = false;
      //   this.winkedRight();
      //   console.log('R closed');
      // } else if (!this.openedEyeR && blinkR < EYE_OPENED_AMOUNT) {
      //   console.log('R opened');

      //   this.openedEyeR = true;
      // }
    }

    if (Settings.panning) {
      const calcValue = (value, min, max) => {
        const delta = max - min;
        const adjustedValue =
          (Math.min(max, Math.max(min, value)) - min) / delta;

        return adjustedValue;
        // let maximumZoomScale = (this.lightbox.currentPage || {}).maximumZoomScale;
        // console.log(zoomLevel);
      };

      const calcValues = (a, b) => {
        const x = calcValue(a, 0, 0.5);
        const outX = 1 - calcValue(b, 0, 0.5);
        const pan = (outX + x) / 2;
        return Math.min(1, Math.max(0, pan));
      };

      trans.x = calcValues(eyeLookInL, eyeLookOutL);
      trans.y = calcValues(eyeLookDownL, eyeLookUpL);
    }

    let lightbox = this.lightbox;
    if (lightbox && lightbox.currentPage) {
      lightbox.currentPage.zoomWithTransform(trans);
    }

    // if (Settings.panning) {
    //   const matrix = ThreeAR.convertTransformArray(transform);

    //   // const rotation = new THREE.Vector3();
    //   // matrix.extractRotation(rotation);

    //   var position = new THREE.Vector3();
    //   var quaternion = new THREE.Quaternion();
    //   var scale = new THREE.Vector3();

    //   matrix.decompose(position, quaternion, scale);

    //   var rotation = new THREE.Euler().setFromQuaternion(quaternion, 'XZY');

    //   const MIN_ROT = 0;
    //   const MAX_ROT = 0.8;
    //   const pan = {
    //     x: Math.max(MIN_ROT, rotation.x / MAX_ROT),
    //     y: Math.max(MIN_ROT, rotation.z / MAX_ROT),
    //   };
    //   console.log(pan.x, pan.y); //, rotation.z
    // }

    // console.log('face shapes', blendShapes);

    this.setState({ ...blendShapes });

    // if (this.scrollView && this.contentSize) {
    //   let scrollSpace = {
    //     width: Math.max(
    //       0,
    //       this.contentSize.width - this.scrollViewLayout.width,
    //     ),
    //     height: Math.max(
    //       0,
    //       this.contentSize.height - this.scrollViewLayout.height,
    //     ),
    //   };

    //   const scrollCenter = {
    //     x: scrollSpace.width * 0.5,
    //     y: scrollSpace.height * 0.5,
    //   };

    //   console.log('and', { scrollSpace, scrollCenter });

    //   this.scrollView.scrollResponderZoomTo({
    //     x: 0,
    //     y: 0,
    //     ...scrollCenter,
    //     width: this.props.zoomWidth,
    //     height: this.props.zoomHeight,
    //     animated: true,
    //   });

    //   this.scrollView.scrollTo({
    //     // x: eyeLookInL * this.contentSize.width,
    //     // y: leftEyebrow * this.contentSize.height,
    //     ...scrollCenter,
    //     animated: false,
    //   });
    // }
  };

  componentWillUnmount() {
    AR.removeAllListeners(AR.EventTypes.AnchorsDidUpdate);
  }

  onContextCreate = async event => {
    this.commonSetup(event);
  };

  commonSetup = ({ gl, scale, width, height }) => {
    this.renderer = new ExpoTHREE.Renderer({
      gl,
      width,
      height,
      pixelRatio: scale,
    });
    this.scene = new THREE.Scene();
    this.scene.background = new ThreeAR.BackgroundTexture(this.renderer);

    this.camera = new ThreeAR.Camera(width, height, 0.01, 1000);
  };

  onResize = ({ x, y, scale, width, height }) => {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(scale);
    this.renderer.setSize(width, height);
  };

  onRender = () => {
    this.renderer.render(this.scene, this.camera);
  };

  handleResetZoomScale = event => {
    this.scrollView.scrollResponderZoomTo({
      x: 0,
      y: 0,
      width: this.props.zoomWidth,
      height: this.props.zoomHeight,
      animated: true,
    });
  };

  render() {
    const keysToDisplay = [AR.BlendShapes.EyeLookInL];

    /*

*/
    return (
      <View style={styles.container}>
        <GraphicsView
          style={StyleSheet.absoluteFillObject}
          onContextCreate={this.onContextCreate}
          onRender={this.onRender}
          onResize={this.onResize}
          ignoresSafeGuards
          arTrackingConfiguration={AR.TrackingConfigurations.Face}
          isArEnabled
          isArCamera
          id={'graphics-view'}
        />
        <LightBoxWrapper
          id={'light-box'}
          ref={ref => (this._lightboxContainer = ref)}
        />

        <View style={styles.infoContainer}>
          {keysToDisplay.map((item, index) => (
            <InfoBox key={`-${index}`} title={item}>
              {this.state[item]}
            </InfoBox>
          ))}
        </View>
      </View>
    );
  }

  //   <ScrollView
  //   maximumZoomScale={2}
  //   minimumZoomScale={1}
  //   contentContainerStyle={{
  //     justifyContent: 'center',
  //     alignItems: 'center',
  //   }}
  //   onContentSizeChange={(height, width) =>
  //     (this.contentSize = { height, width })
  //   }
  //   onLayout={({ nativeEvent: { layout } }) =>
  //     (this.scrollViewLayout = layout)
  //   }
  //   style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.2)' }}
  //   ref={ref => (this.scrollView = ref)}
  // >
  //   <Image
  //     source={require('./assets/expo.symbol.white.png')}
  //     style={{
  //       width: '100%',
  //       aspectRatio: 1,
  //       resizeMode: 'contain',
  //       backgroundColor: 'red',
  //     }}
  //   />
  // </ScrollView>
}

class LightBoxWrapper extends React.PureComponent {
  shouldComponentUpdate() {
    return false;
  }
  render() {
    return <Lightbox id={'light-box'} ref={ref => (this.lightbox = ref)} />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // alignItems: 'center',
    // justifyContent: 'center',
    // paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1',
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#34495e',
  },
  infoContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: '10%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBoxContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  infoTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 16,
  },
  infoSubtitle: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.8,
  },
  coolMessage: {
    color: 'red',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 24,
    position: 'absolute',
    left: 24,
    right: 24,
    padding: 24,
    backgroundColor: 'white',
    bottom: '10%',
  },
});

class InfoBox extends React.PureComponent {
  render() {
    const { title, children } = this.props;
    let value = (children || 0).toFixed(2);
    return (
      <View style={styles.infoBoxContainer}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoSubtitle}>{value}</Text>
      </View>
    );
  }
}
