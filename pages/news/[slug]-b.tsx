//@ts-nocheck
import database from '../../src/database';
import { useEffect, useCallback, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import Yoast from '../components/yoast';

export async function getServerSideProps(context) {
	const page = context.query.slug;

	const db = new database();

	// Page Base Data
	const results = await db.query(
		"SELECT wpimp_posts.id, wpimp_posts.post_title, wpimp_terms.name, wpimp_posts.post_name, wpimp_posts.post_date, wpimp_posts.post_title, wpimp_posts.post_excerpt, wpimp_posts.guid, wpimp_terms.name AS category, (SELECT guid FROM wpimp_posts WHERE id = wpimp_postmeta.meta_value) AS image FROM wpimp_posts, wpimp_postmeta, wpimp_term_relationships, wpimp_terms WHERE wpimp_posts.id = wpimp_term_relationships.object_id AND wpimp_terms.term_id = wpimp_term_relationships.term_taxonomy_id AND wpimp_posts.post_status = 'publish' AND wpimp_posts.post_type = 'post' AND wpimp_postmeta.post_id = wpimp_posts.id AND wpimp_postmeta.meta_key = '_thumbnail_id' AND wpimp_posts.post_name = '" +
			page +
			"'"
	);

	// Page Yoast Data
	const yoast = await db.query(
		"SELECT p.ID, p.post_title, pm.meta_key, pm.meta_value FROM wpimp_posts p LEFT JOIN wpimp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_yoast_wpseo_metadesc' WHERE p.post_type in ('post', 'page') AND p.post_status='publish' AND p.id = " +
			'1307;' +
			';'
	);
	// console.log(yoast);

	// Page ACF Data
	const acf1 = await db.query(
		'SELECT * FROM wpimp_postmeta WHERE post_id = ' +
			results[0].id +
			" AND meta_value LIKE 'field_%'"
	);

	// Loop through the results and get the real meta_key value
	let array = [];
	acf1.forEach((item) => {
		const push = item.meta_key.substr(1);
		array.push(push);
	});

	// Query based on ACF available by slug
	const acf2 = await db.query(
		'SELECT * FROM wpimp_postmeta WHERE post_id = "' +
			results[0].id +
			'" AND meta_key IN (' +
			'"' +
			array.join('" , "') +
			'"' +
			')'
	);

	// Debug

	// console.log('acf2');
	// console.log(acf2);

	return {
		props: {
			news: results.map((row) => {
				return {
					ID: row.id,
					slug: row.post_name,
					date: JSON.stringify(
						row.post_date.toLocaleDateString('en-GB')
					),
					title: row.post_title,
					excerpt: row.post_excerpt,
					image: row.image,
					category: row.category,
				};
			}),
			yoast: yoast.map((row) => {
				return {
					ID: row.ID,
					postTitle: row.post_title,
					metaKey: row.meta_key,
					metaValue: row.meta_value,
				};
			}),
			acf: acf2.map((row) => {
				return {
					metaID: row.meta_id,
					postID: row.post_id,
					metaKey: row.meta_key,
					metaValue: row.meta_value,
				};
			}),
		},
	};
}

export default function Page({ yoast, news, acf }) {
	return (
		<>
			<Yoast />
			<section class="yoast">
				{yoast.map(({ ID, postTitle, metaKey, metaValue }) => (
					<div
						key={ID}
						className={`acf-item yoast-meta-${ID}`}
					>
						<p>
							<strong>{postTitle}</strong>
							<div>Key: {metaKey}</div>
							<div>Value: {metaValue}</div>
						</p>
					</div>
				))}
			</section>
			<section class="posts">
				{news.map(
					({ ID, slug, date, title, excerpt, image, category }) => (
						<div
							key={ID}
							className={`posts-item post-${ID}`}
						>
							<a href={'/news' + slug}>
								<h2>{title}</h2>
								<p>{excerpt}</p>
								<p>
									<strong>{category}</strong>
								</p>
								<p>
									<date>{date}</date>
								</p>
								<img
									src={image}
									alt=""
								/>
							</a>
						</div>
					)
				)}
			</section>
			<section class="acf">
				{acf.map(({ metaID, postID, metaKey, metaValue }) => (
					<div
						key={metaID}
						className={`acf-item acf-meta-${metaID} acf-post-${postID}`}
					>
						<p>
							<strong>{metaKey}</strong>
							<div>{metaValue}</div>
						</p>
					</div>
				))}
			</section>
		</>
	);
}
