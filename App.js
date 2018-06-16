import { AR } from 'expo';
import { View as GraphicsView } from 'expo-graphics';
import ExpoTHREE, { AR as ThreeAR, THREE } from 'expo-three';
import React, { Component } from 'react';
import { Slider, StyleSheet, Text, View } from 'react-native';

import Lightbox from './Lightbox';

const blendShapes = [
  AR.BlendShapes.EyeLookInL,
  AR.BlendShapes.EyeLookOutL,
  AR.BlendShapes.EyeLookDownL,
  AR.BlendShapes.EyeLookUpL,
  AR.BlendShapes.EyeBlinkL,
  AR.BlendShapes.EyeBlinkR,
  AR.BlendShapes.MouthPucker,
  AR.BlendShapes.MouthSmileL,
];

const Settings = {
  pageTurning: true,
  zooming: true,
  panning: true,
};

export default class App extends React.PureComponent {
  state = {
    maximumZoomScale: 2,
    opacity: 0.3,
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
  };

  handleFace = (anchor, eventType) => {
    const { blendShapes, transform } = anchor;

    const {
      [AR.BlendShapes.EyeLookInL]: eyeLookInL,
      [AR.BlendShapes.EyeLookOutL]: eyeLookOutL,
      [AR.BlendShapes.EyeBlinkL]: blinkL,
      [AR.BlendShapes.EyeBlinkR]: blinkR,
      [AR.BlendShapes.MouthPucker]: mouthPucker,
      [AR.BlendShapes.EyeLookDownL]: eyeLookDownL,
      [AR.BlendShapes.EyeLookUpL]: eyeLookUpL,
      [AR.BlendShapes.MouthSmileL]: smileL,
    } = blendShapes;

    if (Settings.pageTurning) {
      const EYE_CLOSED_AMOUNT = 0.4;
      const EYE_OPENED_AMOUNT = 0.0001;
      if (this.openedEyeL && blinkL > EYE_CLOSED_AMOUNT) {
        this.openedEyeL = false;
        this.winkedLeft();
        console.log('L closed');
        return;
      } else if (!this.openedEyeL && blinkL < EYE_OPENED_AMOUNT) {
        console.log('L opened');
        this.openedEyeL = true;
      }

      if (this.openedEyeR && blinkR > EYE_CLOSED_AMOUNT) {
        this.openedEyeR = false;
        this.winkedRight();
        console.log('R closed');
        return;
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
      trans.scale = 1 + zoomLevel;
    }

    if (Settings.panning) {
      const calcValue = (value, min, max) => {
        const delta = max - min;
        const adjustedValue =
          (Math.min(max, Math.max(min, value)) - min) / delta;

        return adjustedValue;
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

    this.setState({ ...blendShapes });
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
    const keysToDisplay = [AR.BlendShapes.MouthSmileL];

    let smile = this.state[AR.BlendShapes.MouthSmileL];
    if (smile < 0.15) {
      smile = 0;
    }
    const shakeMax = 12;
    const shakeAmount = shakeMax - 2 * shakeMax * Math.random();
    let intensityShake = shakeAmount * smile;
    if (isNaN(intensityShake)) {
      intensityShake = 0;
    }
    const shakeRot = `${intensityShake}deg`;
    const shakeStyle = {
      transform: [{ rotateZ: shakeRot }],
    };
    return (
      <View style={[styles.container, shakeStyle]}>
        <LightBoxWrapper
          id={'light-box'}
          ref={ref => (this._lightboxContainer = ref)}
        />

        <GraphicsView
          style={[
            { opacity: this.state.opacity },
            StyleSheet.absoluteFillObject,
          ]}
          pointerEvents={'none'}
          onContextCreate={this.onContextCreate}
          onRender={this.onRender}
          onResize={this.onResize}
          ignoresSafeGuards
          arTrackingConfiguration={AR.TrackingConfigurations.Face}
          isArEnabled
          isArCamera
          id={'graphics-view'}
        />

        <View
          style={[styles.infoContainer, { opacity: 1 - this.state.opacity }]}
        >
          {keysToDisplay.map((item, index) => (
            <InfoBox key={`-${index}`} title={item}>
              {this.state[item]}
            </InfoBox>
          ))}
        </View>

        <Slider
          style={{
            position: 'absolute',
            bottom: 48,
            left: 48,
            right: 48,
            height: 24,
          }}
          minimumValue={0.01}
          maximumValue={1}
          value={this.state.opacity}
          minimumTrackTintColor={'orange'}
          thumbTintColor={'black'}
          onValueChange={opacity => this.setState({ opacity })}
        />
      </View>
    );
  }
}

class LightBoxWrapper extends React.PureComponent {
  render() {
    return <Lightbox id={'light-box'} ref={ref => (this.lightbox = ref)} />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
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
