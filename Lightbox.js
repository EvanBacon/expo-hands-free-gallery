import React, { Component } from 'react';
import { Button, Dimensions, StyleSheet, View } from 'react-native';

import Photos from './Photos';
import ViewPager from './ViewPager';
import ZoomImage from './ZoomImage';

const { width: size } = Dimensions.get('window');

export default class App extends Component {
  state = {
    data: Photos.map(uri => ({ uri })),
    index: 0,
  };

  renderItem = ({ item: { uri, size }, index }) => {
    const selected = this.state.index === index;
    return (
      <ZoomImage
        ref={ref => (this.pages[index] = ref)}
        style={styles.item}
        id={index}
        selected={selected}
        uri={uri}
        size={size}
      />
    );
  };

  pages = {};

  get currentPage() {
    return this.pages[this.viewPager.index];
  }

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

        {false && (
          <View style={styles.footer}>
            <Button
              style={styles.button}
              title="previous"
              onPress={() => this.previous()}
            />
            <Button
              style={styles.button}
              title="next"
              onPress={() => this.next()}
            />
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  viewPager: {
    flex: 1,
  },
  button: {
    color: 'orange',
  },
  footer: {
    position: 'absolute',
    top: 48,
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
