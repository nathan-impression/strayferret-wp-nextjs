//@ts-nocheck
import database from '../../src/database';
import { useEffect, useCallback, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import Yoast from '../components/yoast';
import phpUnserialize from 'phpunserialize';

export async function getServerSideProps(context) {
	const page = context.query.slug;

	const db = new database();

	// Get Image
	async function getImage(db, image) {
		const result = await db.query(
			"SELECT guid FROM `wpimp_posts` WHERE post_type = 'attachment' AND ID = '" +
				image +
				"'"
		);
		// .then(function (result) {
		// 	console.log(result[0].guid);
		// 	return result[0].guid;
		// });

		return result[0].guid;
	}

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

	// Page ACF Fields by ID
	const acf1 = await db.query(
		'SELECT post_content, post_title, post_name FROM `wpimp_posts` WHERE post_parent = 516;'
	);

	// Set needed arrays Loop through the results and get the real meta_key value
	let fields = [];
	let fieldsMeta = [];
	let fieldsSearchData = [];
	let fieldsData = [];
	let fieldsContent = [];

	// Create first array
	acf1.forEach((item) => {
		const push = item.post_name;
		fieldsMeta.push(push);
		fields.push(item);
	});

	// Get ACF field meta
	const acf2 = await db.query(
		'SELECT * FROM wpimp_postmeta WHERE post_id = ' +
			results[0].id +
			' AND meta_value IN (' +
			'"' +
			fieldsMeta.join('" , "') +
			'"' +
			');'
	);

	//
	acf2.forEach((item) => {
		const push = item.meta_key;
		fieldsData.push(item);
		fieldsSearchData.push(push.slice(1));
	});

	// Get ACF Field content
	const acf3 = await db.query(
		'SELECT * FROM wpimp_postmeta WHERE post_id = ' +
			results[0].id +
			' AND meta_key IN (' +
			'"' +
			fieldsSearchData.join('" , "') +
			'"' +
			');'
	);

	// Create content array to be merged
	acf3.forEach((item) => {
		fieldsContent.push(item);
	});

	// Restructuring arrays to update names
	const fieldsContentUpdated = fieldsContent.map((item) => ({
		name: item.meta_key,
		content: item.meta_value,
	}));
	const fieldsUpdated = fields.map((item) => ({
		serial: item.post_content,
		title: item.post_title,
		field: item.post_name,
	}));
	const fieldsDataUpdated = fieldsData.map((item) => ({
		name: item.meta_key.slice(1),
		field: item.meta_value,
	}));

	// Logic to merge these arrays
	const mergeArrays = (array1 = [], array2 = []) => {
		let res = [];
		res = array1.map((obj) => {
			const index = array2.findIndex((el) => el['field'] == obj['field']);
			const { name } = index !== -1 ? array2[index] : {};
			return {
				...obj,
				name,
			};
		});
		return res;
	};

	const mergeFinalArrays = (array1 = [], array2 = []) => {
		let res = [];
		res = fieldsMerged.map((obj) => {
			const index = array2.findIndex((el) => el['name'] == obj['name']);
			const { content } = index !== -1 ? array2[index] : {};
			return {
				...obj,
				content,
			};
		});
		return res;
	};

	const fieldsMerged = mergeArrays(fieldsUpdated, fieldsDataUpdated);
	const finalFieldsMerged = mergeFinalArrays(
		fieldsMerged,
		fieldsContentUpdated
	);

	// Loop through final array of completed fields to check for types such as Image or Text
	let newVal = finalFieldsMerged.map(function (el) {
		const unserialize = phpUnserialize(el.serial);

		// If Image get url and add to array
		if (unserialize.type == 'image') {
			// const image = await getImage(db, el.content);
			const obj = Object.assign({}, el);
			obj.image = 'image';
			// console.log(image);
			return obj;
		}
		return el;
	});

	// Debug

	console.log('------------------------------');
	console.log(newVal);

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
			acf: newVal.map((row) => {
				return {
					serial: row.serial,
					title: row.title,
					field: row.field,
					name: row.name,
					content: row.content,
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
			<section className="acf">
				{acf.map(({ serial, title, field, name, content }) => (
					<div>
						<div>{serial}</div>
						<div>{title}</div>
						<div>{field}</div>
						<div>{name}</div>
						<div>{content}</div>
					</div>
				))}
			</section>
			{/* <section class="acf">
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
			</section> */}
		</>
	);
}
