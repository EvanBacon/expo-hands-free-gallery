import React, { Component } from 'react';
import { Dimensions, View, StyleSheet, Button } from 'react-native';

import ZoomImage from './ZoomImage';
import ViewPager from './ViewPager';

const { width: size } = Dimensions.get('window');

export default class App extends Component {
  state = {
    data: [
      {
        uri:
          'https://media.licdn.com/mpr/mpr/shrinknp_200_200/p/3/000/02a/1f0/3d8d1a0.jpg',
        size: { width: 200, height: 200 },
      },
      {
        uri:
          'https://media.licdn.com/mpr/mpr/shrinknp_200_200/p/3/000/02a/1f0/3d8d1a0.jpg',
        size: { width: 200, height: 200 },
      },
      {
        uri:
          'https://media.licdn.com/mpr/mpr/shrinknp_200_200/p/3/000/02a/1f0/3d8d1a0.jpg',
        size: { width: 200, height: 200 },
      },
      {
        uri:
          'https://media.licdn.com/mpr/mpr/shrinknp_200_200/p/3/000/02a/1f0/3d8d1a0.jpg',
        size: { width: 200, height: 200 },
      },
      {
        uri:
          'https://media.licdn.com/mpr/mpr/shrinknp_200_200/p/3/000/02a/1f0/3d8d1a0.jpg',
        size: { width: 200, height: 200 },
      },
    ],
    index: 0,
  };

  renderItem = ({ item: { uri, size }, index }) => {
    const selected = this.state.index === index;
    return (
      <ZoomImage
        style={styles.item}
        id={index}
        selected={selected}
        uri={uri}
        size={size}
      />
    );
  };

  previous = () => {
    if (this.viewPager) {
      console.log(this.viewPager.index);
      this.viewPager.previous();
    }
  };
  next = () => {
    if (this.viewPager) {
      console.log(this.viewPager.index);
      this.viewPager.next();
    }
  };

  render() {
    const { data } = this.state;
    return (
      <View style={styles.container}>
        <ViewPager
          onMomentumScrollEnd={() => {
            const { index } = this.viewPager;
            console.log('eng', this.state.index, index);
            if (this.state.index !== index) {
              this.setState({ index });
            }
          }}
          onScroll={({ value }) => console.log('scroll', value)}
          ref={ref => (this.viewPager = ref)}
          data={data}
          renderItem={this.renderItem}
          style={styles.viewPager}
          size={size}
          horizontal={true}
        />

        <View style={styles.footer}>
          <Button title="previous" onPress={() => this.previous()} />
          <Button title="next" onPress={() => this.next()} />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  viewPager: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 8,
    right: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
    width: size,
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
