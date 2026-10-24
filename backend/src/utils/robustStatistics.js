// Robust statistics for latency baselines. The median and the median absolute deviation
// (MAD) are not pulled up by a few very slow responses, unlike the mean and standard
// deviation (Leys et al., 2013, "Detecting outliers: Do not use standard deviation around
// the mean, use absolute deviation around the median", J. Exp. Soc. Psychol. 49(4)).

// Makes the MAD comparable to a standard deviation for normally distributed data.
export const MAD_NORMAL_CONSISTENCY = 1.4826;

export function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

// Median of the distances from the median, scaled by MAD_NORMAL_CONSISTENCY.
export function scaledMedianAbsoluteDeviation(values) {
  const center = median(values);
  const deviations = values.map((value) => Math.abs(value - center));
  return median(deviations) * MAD_NORMAL_CONSISTENCY;
}
