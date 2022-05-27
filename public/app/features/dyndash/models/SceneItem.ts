import { useEffect } from 'react';
import { Observer, ReplaySubject, Subscribable, Subscription } from 'rxjs';

import { PanelData, TimeRange, useObservable } from '@grafana/data';

export abstract class SceneItemBase<TState> implements SceneItem<TState> {
  subject = new ReplaySubject<TState>();
  state: TState;
  parent?: SceneItemBase<any>;
  subs = new Subscription();

  constructor(state: TState) {
    this.state = state;
    this.subject.next(state);
    this.setParent();
  }

  private setParent() {
    for (const propValue of Object.values(this.state)) {
      if (propValue instanceof SceneItemBase) {
        propValue.parent = this;
      }
    }

    const children = (this.state as any).children as Array<SceneItemBase<any>>;
    if (children) {
      for (const child of children) {
        child.parent = this;
      }
    }
  }

  subscribe(observer: Partial<Observer<TState>>) {
    return this.subject.subscribe(observer);
  }

  setState(state: Partial<TState>) {
    this.state = {
      ...this.state,
      ...state,
    };
    this.setParent();
    this.subject.next(this.state);
  }

  abstract Component(props: SceneComponentProps<SceneItem<TState>>): React.ReactElement | null;

  onInView() {
    const { $data } = this.state as SceneItemStateWithScope;
    if ($data) {
      $data.onInView();
    }
  }

  onOutOfView() {
    const { $data } = this.state as SceneItemStateWithScope;
    if ($data) {
      $data.onOutOfView();
    }
  }

  registerOnMountEffect() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      this.onInView();
      return () => this.onOutOfView();
    }, []);
  }

  useState() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useObservable(this.subject, this.state);
  }

  /**
   * Will walk up the scene object graph to the closest context.data scene object
   */
  useData(): SceneDataState {
    const $data = (this.state as SceneItemStateWithScope).$data;
    if ($data) {
      return $data.useState();
    }

    if (this.parent) {
      return this.parent.useData();
    }

    return {};
  }

  /**
   * Will walk up the scene object graph to the closest context.timeRange scene object
   */
  getTimeRange(): SceneItem<SceneTimeRangeState> | null {
    const $timeRange = (this.state as SceneItemStateWithScope).$timeRange;
    if ($timeRange) {
      return $timeRange;
    }

    if (this.parent) {
      return this.parent.getTimeRange();
    }

    return null;
  }

  destroy() {
    this.subs.unsubscribe();
  }
}

export interface SceneItem<TState> extends Subscribable<TState> {
  state: TState;
  Component(props: SceneComponentProps<SceneItem<TState>>): React.ReactElement | null;
  useState(): TState;
  setState(state: TState): void;

  onInView(): void;
  onOutOfView(): void;
}

export interface SceneItemStateWithScope {
  $timeRange?: SceneItem<SceneTimeRangeState>;
  $data?: SceneItem<SceneDataState>;
}

export interface SceneLayoutItemChildState {
  key?: string;
  size?: SceneItemSizing;
}

export interface SceneItemSizing {
  width?: number | string;
  height?: number | string;
  x?: number;
  y?: number;
  hSizing?: 'fill' | 'fixed';
  vSizing?: 'fill' | 'fixed';
}

export interface SceneComponentProps<T> {
  model: T;
}

export interface SceneDataState {
  data?: PanelData;
}

export interface SceneTimeRangeState {
  timeRange: TimeRange;
}