/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {makeComputedArtifact} from '../computed-artifact.js';
import {LanternMetric} from './lantern-metric.js';
import {BaseNode} from '../../lib/dependency-graph/base-node.js';
import {NetworkRequest} from '../../lib/network-request.js';
import {LanternFirstMeaningfulPaint} from './lantern-first-meaningful-paint.js';

/** @typedef {import('../../lib/dependency-graph/base-node.js').Node} Node */

// Any CPU task of 20 ms or more will end up being a critical long task on mobile
const CRITICAL_LONG_TASK_THRESHOLD = 20;

class LanternInteractive extends LanternMetric {
  /**
   * @return {LH.Gatherer.Simulation.MetricCoefficients}
   */
  static get COEFFICIENTS() {
    return {
      intercept: 0,
      optimistic: 0.5,
      pessimistic: 0.5,
    };
  }

  /**
   * @param {Node} dependencyGraph
   * @return {Node}
   */
  static getOptimisticGraph(dependencyGraph) {
    // Adjust the critical long task threshold for microseconds
    const minimumCpuTaskDuration = CRITICAL_LONG_TASK_THRESHOLD * 1000;

    return dependencyGraph.cloneWithRelationships(node => {
      // Include everything that might be a long task
      if (node.type === BaseNode.TYPES.CPU) {
        return node.event.dur > minimumCpuTaskDuration;
      }

      // Include all scripts and high priority requests, exclude all images
      const isImage = node.record.resourceType === NetworkRequest.TYPES.Image;
      const isScript = node.record.resourceType === NetworkRequest.TYPES.Script;
      return (
        !isImage &&
        (isScript ||
          node.record.priority === 'High' ||
          node.record.priority === 'VeryHigh')
      );
    });
  }

  /**
   * @param {Node} dependencyGraph
   * @return {Node}
   */
  static getPessimisticGraph(dependencyGraph) {
    return dependencyGraph;
  }

  /**
   * @param {LH.Gatherer.Simulation.Result} simulationResult
   * @param {import('./lantern-metric.js').Extras} extras
   * @return {LH.Gatherer.Simulation.Result}
   */
  static getEstimateFromSimulation(simulationResult, extras) {
    if (!extras.fmpResult) throw new Error('missing fmpResult');

    const lastTaskAt = LanternInteractive.getLastLongTaskEndTime(simulationResult.nodeTimings);
    const minimumTime = extras.optimistic
      ? extras.fmpResult.optimisticEstimate.timeInMs
      : extras.fmpResult.pessimisticEstimate.timeInMs;
    return {
      timeInMs: Math.max(minimumTime, lastTaskAt),
      nodeTimings: simulationResult.nodeTimings,
    };
  }

  /**
   * @param {LH.Artifacts.MetricComputationDataInput} data
   * @param {LH.Artifacts.ComputedContext} context
   * @return {Promise<LH.Artifacts.LanternMetric>}
   */
  static async compute_(data, context) {
    const fmpResult = await LanternFirstMeaningfulPaint.request(data, context);
    const metricResult = await this.computeMetricWithGraphs(data, context, {fmpResult});
    metricResult.timing = Math.max(metricResult.timing, fmpResult.timing);
    return metricResult;
  }

  /**
   * @param {LH.Gatherer.Simulation.Result['nodeTimings']} nodeTimings
   * @return {number}
   */
  static getLastLongTaskEndTime(nodeTimings, duration = 50) {
    return Array.from(nodeTimings.entries())
      .filter(([node, timing]) => {
        if (node.type !== BaseNode.TYPES.CPU) return false;
        return timing.duration > duration;
      })
      .map(([_, timing]) => timing.endTime)
      .reduce((max, x) => Math.max(max || 0, x || 0), 0);
  }
}

const LanternInteractiveComputed = makeComputedArtifact(
  LanternInteractive,
  ['devtoolsLog', 'gatherContext', 'settings', 'simulator', 'trace', 'URL']
);
export {LanternInteractiveComputed as LanternInteractive};
